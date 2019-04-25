require('dotenv-extended').load();
const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io').listen(server);
const dgram = require('dgram');
const mongoose = require('mongoose');
const cors = require('cors');
const { exec } = require('child_process');


app.use(cors());
const { MongoClient } = require('mongodb');
const routes = require('./routes');
const models = require('./models');
const cosmosdb = require('./cosmosdb'); // includes cosmosdb.js

app.use(express.static(`${__dirname}/node_modules`));
app.use(express.static(path.join(__dirname, '/public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routes);

mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) {
    console.log(err);
  }
});


const mongoURLCosmos = process.env.MONGO_URL;
// console.log(process.env.MONGO_URL)

function getAgentCommandList(str) {
  // console.log(str)
  const list = [];
  const commands = str.split('\n\n');
  let cmd;
  let fields;
  for (let i = 1; i < commands.length; i += 1) {
    fields = commands[i].split('\n');
    cmd = { command: fields[0].trim().split(' ')[0], detail: commands[i] };
    list.push(cmd);
  }
  return list;
}
const agentsToLog = [];// agents to log data
io.on('connection', (client) => {
  // handle requests from client
  client.on('start record', (msg) => {
    const index = agentsToLog.indexOf(msg);
    if (index === -1) {
      agentsToLog.push(msg);
    }
    // console.log(agentsToLog)
  });
  client.on('end record', (msg) => {
    const index = agentsToLog.indexOf(msg);
    if (index === -1) {
      agentsToLog.splice(index, 1);
    }
    // console.log(agentsToLog)
  });
  client.on('save plot_config', msg => new models.PlotConfigurations(msg).save((err) => { // this is where it is inserted to mongodb
    if (err) {
      console.log(err);
    }
  }));
  client.on('update plot_config', (msg) => {
    models.PlotConfigurations.findByIdAndUpdate(msg.id, msg.data, { new: true }, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
  client.on('list_widget_config', (msg, callback) => {
    MongoClient.connect(mongoURLCosmos, { useNewUrlParser: true }, (err, db) => {
      const dbo = db.db('cosmos');
      const agentDb = dbo.collection('widget_configurations');

      agentDb.find({}).toArray((err0r, result) => {
        if (err0r) throw err0r;
        if (result.length > 0) {
          callback(result);
        } else callback(['nothing']);
      });
    });
  });

  client.on('save widget_config', (msg, callback) => {
    new models.WidgetConfigurations(msg).save((err, i) => {
      if (err) {
        console.log(err);
      } else {
        callback({ id: i.id })
      }
    });
  });
  client.on('update widget_config', (msg) => {
    models.WidgetConfigurations.findByIdAndUpdate(msg.id, msg.data, { new: true }, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
  client.on('cosmos_command', (msg) => {
  // console.log('command recvd: ', msg)
    let cmd = msg.command;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
      } else {
        client.emit('cosmos_command_response', { output: stdout });
      }
    });
  });
  client.on('list_agent_commands',(msg, callback) => {
    const { agent } = msg;
    const { node } = msg;
    exec(`agent ${node} ${agent}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
      } else {
        console.log(getAgentCommandList(stdout))
        callback({ command_list: getAgentCommandList(stdout) });
      }
    });
  });
  client.on('agent_command', (msg, callback) => {
    const cmd = `agent ${msg.node} ${msg.agent} ${msg.command}`;
    exec(cmd, (error, stdout,  stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
      } else { callback({ output: stdout }); }
    });
  });
  client.on('agent_dates', (msg, callback) => {
    // console.log(msg)
    const { agent } = msg;
    const { node } = msg;
    let data;

    MongoClient.connect(mongoURLCosmos,{ useNewUrlParser: true }, (err, db) => {
      const dbo = db.db('cosmos');
      const agentDb = dbo.collection(`${node}_${agent}`);
      let dates = {};

      agentDb.find().sort({ 'time': 1 }).limit(1).toArray((error, result) => {
        if (error) throw error;
        if (result.length > 0) {
          dates.start = result[0].time;
          agentDb.find().sort({ 'time': -1 }).limit(1).toArray((errr, res) => {
            if (errr) throw errr;
            if (result.length > 0) {
              // console.log('latest:',result[0].time);
              dates.end = result[0].time;
              db.close();
              data = { valid: true, dates: dates };
              // console.log("sending", data)
              callback(data);
            } else callback({ valid: false });
          });
        } else {
          data = { valid: false };
          callback(data);
        }
      });
    });
  });

  client.on('agent_query', (msg, callback) => {
    const { agent } = msg;
    const { node } = msg;
    const start = msg.startDate;
    const end = msg.endDate;
    const { fields } = msg;

    MongoClient.connect(mongoURLCosmos, { useNewUrlParser: true }, (err, db) => {
      const dbo = db.db('cosmos');
      const agentDb = dbo.collection(`${node}_${agent}`);
      const query = { time: { $gte:new Date(start), $lte:new Date(end) } };
      const selector = { 'agent_utc': true, '_id': false };
      for (let i = 0; i < fields.length; i += 1) {
        selector[fields[i]] = true;
      }

      agentDb.find(query,{projection: selector} ).toArray((err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          callback(result);
        } else {
          callback([]);
        }
      });
    });
  });
  client.on('agent_resume_live_plot', (msg, callback) => {
    // console.log(msg)
    const { agent } = msg;
    const { node } = msg;
    const start = msg.resumeUTC;
    const { fields } = msg ;

    MongoClient.connect(mongoURLCosmos,{ useNewUrlParser: true }, (err, db) => {
      const dbo = db.db('cosmos');
      // var agentDb = dbo.collection('agent_'+agent);
      const agentDb = dbo.collection(`${node}_${agent}`);
      const query = { agent_utc: { $gte: start } };
      const selector = { 'agent_utc': true, '_id': false };
      for (let i = 0; i < fields.length; i += 1) {
        selector[fields[i]] = true;
      }
      // console.log("selector", selector)
      // query ={}
      agentDb.find(query, { projection: selector }).sort({ time: 1 }).toArray((err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          callback(result);
        } else {
          callback([]);
        }
      });
    });
  });
});

/* COSMOS SOCKET SETUP */
const cosmosSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

const COSMOS_PORT = 10020;
const COSMOS_ADDR = '225.1.1.1';
cosmosSocket.bind(COSMOS_PORT);
cosmosSocket.on('listening', () => {
  cosmosSocket.addMembership(COSMOS_ADDR);
  const address = cosmosSocket.address();
  console.log(`UDP Server listening on ${  address.address  }:${  address.port}`);
});

let agentListDB = [];


// console.log("MONGO_URL:", mongoURLCosmos);
// updateAgentList();
models.AgentList.find().distinct('agent_proc', (err, docs) => {
  if (!err) {
    agentListDB = Array.from(docs);
    // console.log(docs, typeof Array(agentListDB))
  } else { throw err; }
});
let obj = {};
let agentListObj = {};
let imuOmega = {};
let imuIndex = 0;
let sentImuIndex = 0;
cosmosSocket.on('message', (message) => {
  obj = message.slice(3, message.length - 1);
  let json_str = obj.toString('ascii');
  json_str = json_str.replace(/}{/g, ',')
  let validAgent = false;
  if (!json_str.endsWith('[NOK]') && !json_str.endsWith('[OK]')  ) {
    try {
      obj = JSON.parse(json_str);
      if (obj.agent_proc && obj.agent_addr
        && obj.agent_port && obj.agent_node
        && obj.agent_utc && obj.agent_bprd) {
        validAgent = true;
      }
    } catch(e) {
      try {
        obj = JSON.parse(json_str + '}');
        if (obj.agent_proc && obj.agent_addr
          && obj.agent_port && obj.agent_node
          && obj.agent_utc && obj.agent_bprd) {
          validAgent = true;
        }
      }  catch(e) {}
    }
  }

  if (validAgent) {
    // console.log(obj)
    io.emit(`agent subscribe ${obj.agent_proc}`, obj);
    if (obj.agent_node === 'me213ao') {

      if (obj.device_gps_geods_000) {
        let latitude = obj.device_gps_geods_000.lat;
        let longitude = obj.device_gps_geods_000.lon;
        let altitude = obj.device_gps_geods_000.h;
        let acceleration_x, acceleration_y, acceleration_z;

        if (obj.device_imu_accel_000) {
          acceleration_x = obj.device_imu_accel_000[0];
          acceleration_y = obj.device_imu_accel_000[1];
          acceleration_z = obj.device_imu_accel_000[2];
        }

        io.emit('balloon path', {
          satellite: 'me213ao',
          latitude,
          longitude,
          altitude,
          acceleration: [acceleration_x, acceleration_y, acceleration_z]
        });

        // new models.Path({
        //   satellite: 'me213ao',
        //   latitude,
        //   longitude,
        //   altitude,
        // }).save(err => {
        //  if (err) {
        //    console.log(err);
        //  }
        //});
      }
    }

    if (obj.agent_node === 'cubesat1') { // Check if node is the cubesat
      if (obj.node_loc_pos_eci) { // If the position is defined

        // Convert x, y, z coordinates from meters to kilometers
        let satellite_position_x = obj.node_loc_pos_eci.pos[0] / 1000;
        let satellite_position_y = obj.node_loc_pos_eci.pos[1] / 1000;
        let satellite_position_z = obj.node_loc_pos_eci.pos[2] / 1000;

        // console.log(satellite_position_x,
        //   satellite_position_y,
        //   satellite_position_z);

        // Emit satellite position to client
        io.emit('satellite orbit', {
          satellite: 'cubesat1',
          x: satellite_position_x,
          y: satellite_position_y,
          z: satellite_position_z,
        });

        new models.Orbit({
          satellite: 'cubesat1',
          x: satellite_position_x,
          y: satellite_position_y,
          z: satellite_position_z,
        }).save((err) => { // this is where it is inserted to mongodb
          if (err) {
            console.log(err);
          }
        });
      }

      // If quaternions are defined
      if (obj.node_loc_att_icrf) {
        // Get w, x, y, z components of quaternions
        let satellite_orientation_w = obj.node_loc_att_icrf.pos.w;
        let satellite_orientation_x = obj.node_loc_att_icrf.pos.d.x;
        let satellite_orientation_y = obj.node_loc_att_icrf.pos.d.y;
        let satellite_orientation_z = obj.node_loc_att_icrf.pos.d.z;

        // console.log(satellite_orientation_w);
        // console.log(satellite_orientation_x);
        // console.log(satellite_orientation_y);
        // console.log(satellite_orientation_z);

        // Emit data to client
        io.emit('satellite attitude', {
          satellite: 'cubesat1',
          x: satellite_orientation_x,
          y: satellite_orientation_y,
          z: satellite_orientation_z,
          w: satellite_orientation_w,
        });

        new models.Attitude({
          satellite: 'cubesat1',
          x: satellite_orientation_x,
          y: satellite_orientation_y,
          z: satellite_orientation_z,
          w: satellite_orientation_w,
        }).save((err) => { // this is where it is inserted to mongodb
          if (err) {
            console.log(err);
          }
        });
      }

      // 10.42.0.126
    }

    agent_utc = obj.agent_utc;
    if (message.type === 'utf8') {
      console.log(`Received Message: ${  message.utf8Data}`);
    } else if (message.type === 'binary') {
      console.log(`Received Binary Message of ${  message.binaryData.length  } bytes`);
    }

    // Maintain the list of agents
    if (!(obj.agent_proc in agentListObj)) {
      agentListObj[obj.agent_proc] = [obj.agent_utc, ' '+obj.agent_node, ' '+obj.agent_addr, ' '+obj.agent_port, ' '+obj.agent_bsz];
      console.log('new agent',obj.agent_proc)
    } else {
      // Update the time stamp
      agentListObj[obj.agent_proc][0] = obj.agent_utc;
    }

    // Collect the IMU Omega data from the ADCS agent
    if (obj.agent_proc === 'adcs') {
      imuOmega[imuIndex] = obj.device_imu_omega_000;
      imuIndex++;
    }
    // Recording agent data to mongoDB
    if (agentsToLog.indexOf(obj.agent_proc) > -1) {
      MongoClient.connect(mongoURLCosmos,{ useNewUrlParser: true }, (err, db) => {
        const dbo = db.db('cosmos');
        const agentDb = dbo.collection(`${obj.agent_node}_${obj.agent_proc}`);
        const entry = obj;
        entry.time = new Date();
        agentDb.insertOne(entry, (err, res) => {
          db.close();
        });
      });
    }
    if (Array.from(agentListDB).indexOf(obj.agent_proc) > -1) {
      // update time stamp
      // console.log(agentListDB)
      models.AgentList.findOneAndUpdate(
        { agent_proc: obj.agent_proc },
        { $set: { agent_utc: obj.agent_utc } }, // update query
        (err, docs) => { // callback
          if (!err) {
            agentListDB = docs;
          } else { throw err; }
        }
      );
    } else {
      // update list and double check the list again
      models.AgentList.find().distinct('agent_proc', (err, docs) => {
        if (!err) {
          agentListDB = docs;
          if (Array.from(agentListDB).indexOf(obj.agent_proc) <= -1) {
            const dataStruc = cosmosdb.agent_structure(obj);
            new models.AgentList(
              {
                agent_proc: obj.agent_proc,
                agent_addr:  obj.agent_addr,
                agent_port: obj.agent_port,
                agent_node: obj.agent_node,
                agent_utc: obj.agent_utc,
                agent_bprd: obj.agent_bprd,
                structure: dataStruc
              },
            ).save((err) => { // this is where it is inserted to mongodb
              if (err) {
                console.log(err);
              } else {
                models.AgentList.find().distinct('agent_proc', (err, docs) => {
                  if (!err) {
                    agentListDB = docs;
                  }
                });
              }
            });
          }
        }
      });
    }
  }
});

setInterval(() => {
  io.emit('agent update list', agentListObj);
}, 5000);
const port = 3001;
const hostnameEnv = process.env.SATELLITE_IP;
server.listen(port, hostnameEnv, () => {
  console.log(`Server running at http://${hostnameEnv}:${port}/`);
});
