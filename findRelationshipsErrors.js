//models config
var DbModule = require('./models/Db.js');
var LegislativeProposition = require('./models/LegislativeProposition.js');
var LegislativePropositionRelationshipType = require('./models/LegislativePropositionRelationshipType.js');
var LegislativePropositionType = require('./models/LegislativePropositionType.js');

DbModule.setDbURI("mongodb://127.0.0.1/site-camara");
DbModule.useMock(false);

DbModule.connect(function(mongoose, connection) {

   //LegislativeProposition Model
   LegislativeProposition.setMongoose(mongoose);
   LegislativeProposition.setConnection(connection);
   //LegislativePropositionRelationshipType Model
   LegislativePropositionRelationshipType.setMongoose(mongoose);
   LegislativePropositionRelationshipType.setConnection(connection);
   //LegislativePropositionType Model
   LegislativePropositionType.setMongoose(mongoose);
   LegislativePropositionType.setConnection(connection);

   //legislative proposition tag schema definition
   var relationshipsViewSchema = new mongoose.Schema({
      "type" : {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'LegislativePropositionType',
           required: false
      },
      "otherLegislativeProposition" : {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'LegislativeProposition',
           required: false
      },
      "antonymType" : {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'LegislativePropositionType',
           required: false
      },
      "legislativeProposition" : {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'LegislativeProposition',
           required: false
      }
   });

   mongoose.model('relationships', relationshipsViewSchema, 'relationships');

   var relationshipsView = connection.model('relationships', relationshipsViewSchema, 'relationships');
   relationshipsView.find({}).then(async function(elements) {
      var i = 0;
      var relationshipA;
      var relationshipB;
      var relationshipType = null;
      var legislativeProposition = null;
      var otherLegislativeProposition = null;
      var legislativePropositionType = null;
      console.log("======SIZE=======");
      console.log(elements.length)
      console.log("=============");
      for (i = 0; i < elements.length; i++) {
         relationshipA = elements[i];
            relationshipB = await relationshipsView.findOne({
               "legislativeProposition": relationshipA.otherLegislativeProposition,
               "otherLegislativeProposition": relationshipA.legislativeProposition,
               "type": relationshipA.antonymType
            });
            if (!relationshipB) {
               legislativeProposition = await LegislativeProposition.getModel().findById(relationshipA.legislativeProposition);
               relationshipType = await LegislativePropositionRelationshipType.getModel().findById(relationshipA.type);
               otherLegislativeProposition = await LegislativeProposition.getModel().findById(relationshipA.otherLegislativeProposition);
               legislativePropositionType = await LegislativePropositionType.getModel().findById(otherLegislativeProposition.type);
               console.log(relationshipA.legislativeProposition + ";" + legislativeProposition.number + ";" + legislativeProposition.year + ";" + relationshipType.description + ";" + otherLegislativeProposition.number + ";" + otherLegislativeProposition.year);
            }
      }
      console.log("======OK=======");
   });
});
