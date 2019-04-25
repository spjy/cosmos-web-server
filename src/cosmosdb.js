
var cosmosdb = {
  agent_structure : function(json){
    var list=[]
    var keys = Object.keys(json);
    for(var i = 0; i < keys.length; i++){
      var entry = json[keys[i]];
      var name = keys[i];
      var values = []
      if(!name.includes("agent_")){
        if(Array.isArray(entry)){
          for(var c = 0; c < entry.length; c++){
            var child = [name, c];
            list.push(child);
          }
        }
        else if(typeof entry === 'object'){
          var children = cosmosdb.agent_structure(entry);

          for(var c = 0; c < children.length; c++){
            var child = children[c];
            var item = [name];
            for(var j = 0; j < child.length; j++){
              item.push(child[j])
            }
            list.push(item)
          }
        }
        else {
          list.push([name])
        }
      }
    }
    return list;
  }
}
module.exports = cosmosdb;
