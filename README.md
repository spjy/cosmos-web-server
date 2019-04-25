# COSMOS Web
for the Hawaii Space Flight Laboratory, by Spencer Young

COSMOS Web is a JavaScript application built using Node.js for the application programmable interface (API) and React.js for the front-facing web interface. It was conceptualized and built into fruition to supplement mission operations tasks by visualizing incoming telemetery data from satellites such as position and attitude. In addition, the project was partially an experiment to test the capabilities and limitations of building an interface on JavaScript; after assessing its advantages, it became an exploitation of the ease of use and the expansive supporting ecosystem that the platform offers. For example, since this application is web based, it is hardware agnostic and accessed anywhere; the only requirement is to have access to the internet and a web browser. Not only is it hardware agnostic, but updates to the software requires a mere push to the code base, and nothing is required of the end-user, whereas a desktop application would require a download to update it.

## Requirements
- [NodeJS (latest LTS version)](https://nodejs.org)
- [MongoDB 3.4+](https://www.mongodb.com/)
- [COSMOS](http://cosmos-project.org/)

## Installing

1. Clone the repository
2. In `/`, rename `.env.example` to `.env`. Replace `SATELLITE_IP` with the IP of the propagator or socket.
3. Install dependencies in `/` and `/client`:
```
$ npm install
```
4. Install nodemon globally:
```
$ npm install -g nodemon
```

## Running

1. Run server in `/`:
```
$ npm start
```
2. Run client in `/client`:
```
$ npm start
```
3. Access the site at http://localhost:3000

4. Run the COSMOS Propagator (simple)
```
$ propagator_simple
```

## Directory Structure

```bash
client/
├── public/
├── src/
│   ├── components/
│   │   ├── Attitude/
│   │   ├── Global/
│   │   ├── Orbit/
│   │   ├── Path/
│   │   ├── Attitude.js
│   │   ├── Home.js
│   │   ├── Orbit.js
│   │   ├── Path.js
│   └───└── Plot.js
├── App.js
└── index.js

server/
├── middlware/
├── models/
├── resources/
└── routes/
```

### Client
The client is composed of the React.js frontend.

1. `/public` contains static assets.
2. `/src` contains the React.js source.

Inside `/src` the root contains the main application.
- `index.js` contains React.js instance.
- `App.js` contains the React Router routes. Import the page layouts in here.

Inside `/src/components` the root contains the page layouts. Each page contains a corresponding folder where you can find the components unique to that page.

Inside `/src/components/Global` contains shared components between pages.

### Server
The server is composed of Node.js with Express.js middleware.

1. `/middleware`
2. `/models`
3. `/resources`
4. `/routes`

Inside `/middleware` contains reusable routing methods.

Inside `/models` contains the database schemas.

Inside `/resources` contains the API routes.

Inside `/routes` contains the non-API routes.

## Stack
COSMOS Web uses various frameworks to make development easier.

### Client
The primary framework used on the frontend is React.js, a JavaScript library to build user interfaces.

1. **React.js** is being used primarily to assist with building with the user interface; it features object oriented and component reusability ideologies.
2. **React Router** is a router that enables React to be a single page application.
3. **Redux** is being used to deal with inter-component state management. States in React.js are easy to work with within components, but if they are shared between components, it's a chore; thus Redux aims to solve that.
4. **Babylon.js** is a web based three dimensional rendering engine powered by WebGL. Bablyon is used to visualize the satellite's position, attitude and orientation.

### Server
The primary framework being used for the server is Express.js, a web application framework used to build APIs.

1. **Express.js** is a server framework for Node.js
2. **MongoDB** is a NoSQL database to store incoming data for data replay.
3. **Mongoose** is a object relational mapper for MongoDB built for Node.js. This is used to apply methods (such as querying and filtering) on MongoDB
4. **socket.io** is used for web socket communication for real time data updates.
