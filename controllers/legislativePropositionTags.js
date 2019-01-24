
/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var LegislativePropositionTagModule = require('../models/LegislativePropositionTag.js');
var LegislativePropositionTag = LegislativePropositionTagModule.getModel();
var LegislativePropositionModule = require('../models/LegislativeProposition.js');
var LegislativeProposition = LegislativePropositionModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...
//..
//.

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
module.exports.newLegislativePropositionTag = function(req, res, next) {
   if(req.body.legislativePropositionTag) {
      var legislativePropositionTagJSON = req.body.legislativePropositionTag;
      var legislativePropositionTag = new LegislativePropositionTag();

      legislativePropositionTag.description = legislativePropositionTagJSON.description;
      legislativePropositionTag.propositionType = legislativePropositionTagJSON.propositionType;;

      winston.debug("Saving new legislative proposition tag ...");

      legislativePropositionTag.save(function(err, legislativePropositionTag) {
         if(!err) {
            winston.verbose("Legislative proposition tag saved.");
            Utils.sendJSONresponse(res, 200, { message: 'legislative proposition tag saved', id: legislativePropositionTag._id });
         } else {
            winston.error("Error while saving the legislative proposition tag, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition tag' });
   }
}

module.exports.editLegislativePropositionTag = function(req, res, next) {
   if(req.body.legislativePropositionTag) {
      var legislativePropositionTagJSON = req.body.legislativePropositionTag;

      LegislativePropositionTag.findById({ _id: legislativePropositionTagJSON.id })
                               .then( function(legislativePropositionTag) {
         if(legislativePropositionTag) {
            var now = new Date();
            legislativePropositionTag.description = legislativePropositionTagJSON.description;

            winston.debug("Saving legislative proposition tag ...");

            legislativePropositionTag.save(function(err, legislativePropositionTag) {
               if(!err) {
                  winston.verbose("Legislative proposition tag saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'legislative proposition tag saved', id: legislativePropositionTag._id });
               } else {
                  winston.error("Error while saving the legislative proposition tag, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'legislative proposition tag not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition tag' });
   }
}

module.exports.getLegislativePropositionTags = function(req, res, next) {
   if(req.params.legislativePropositionTypeId) {
      var legislativePropositionTypeId = req.params.legislativePropositionTypeId;
      LegislativePropositionTag.find({
         'propositionType' : legislativePropositionTypeId
      }).then(function(legislativePropositionTags) {
         Utils.sendJSONresponse(res, 200, {
            'legislativePropositionTags' : legislativePropositionTags
         });
      }).catch(function(err) {
         winston.error("Error while getting legislative proposition tags, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition type id' });
   }
}

module.exports.getLegislativePropositionTag = function(req, res, next) {
   if(req.params.legislativePropositionTagId) {
      var legislativePropositionTagId = req.params.legislativePropositionTagId;
      LegislativePropositionTag.findById({
         _id : legislativePropositionTagId
      })
      .populate({path: 'propositionType'})
      .then(function(legislativePropositionTag) {
         if (legislativePropositionTag) {
            Utils.sendJSONresponse(res, 200, {
               'legislativePropositionTag' : legislativePropositionTag
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'legislative proposition tag not found' });
         }
      }).catch(function(err) {
         winston.error("Error while getting legislative proposition tag, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition tag id' });
   }
}

module.exports.getAllLegislativePropositionTags = function(req, res, next) {
   var legislativePropositionTypeId = req.params.legislativePropositionTypeId;
   LegislativePropositionTag
      .find({})
      .populate({path: 'propositionType'})
      .then(function(legislativePropositionTags) {
         Utils.sendJSONresponse(res, 200, {
            'legislativePropositionTags' : legislativePropositionTags
         });
      }).catch(function(err) {
         winston.error("Error while getting all legislative proposition tags, err = [%s]", err);
         Utils.next(400, err, next);
      });
}

module.exports.removeLegislativePropositionTag = function(req, res, next) {
   if(req.params.legislativePropositionTagId) {
      var legislativePropositionTagId = req.params.legislativePropositionTagId;

      LegislativePropositionTag
               .findById({ _id: legislativePropositionTagId })
               .then( function(legislativePropositionTag) {
                  if (legislativePropositionTag) {
                     return legislativePropositionTag.remove();
                  } else {
                     Utils.sendJSONresponse(res, 400, { message: 'legislative proposition tag not found' });
                     return null;
                  }
               })
               .then(function(removalResult) {
                  if (removalResult) {
                     return LegislativeProposition.find({
                        'tags':  LegislativePropositionTagModule.getMongoose().Types.ObjectId(legislativePropositionTagId)
                     });
                  } else {
                     return null;
                  }
               })
               .then(async function(legislativePropositions) {
                  if (legislativePropositions) {
                     var i;
                     for(i = 0; i < legislativePropositions.length; i++) {
                        var legislativeProposition = legislativePropositions[i];
                        await legislativeProposition.tags.pull(LegislativePropositionTagModule.getMongoose().Types.ObjectId(legislativePropositionTagId));                        
                     }
                     winston.verbose("Legislative proposition tag removed.");
                     Utils.sendJSONresponse(res, 200, { message: 'legislative proposition tag removed' });
                  } else {
                     return null;
                  }
               })
               .catch(function(err) {
                  winston.error("Error while deleting the legislative proposition tag, err = [%s]", err);
                  Utils.next(400, err, next);
               });

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined legislative proposition tag id' });
   }
}

module.exports.checkUniqueDescription = function(req, res, next) {
   var legislativePropositionTypeId = req.params.legislativePropositionTypeId;
   if(legislativePropositionTypeId) {
      var description = req.query.description;
      if(description) {
         LegislativePropositionTag
             .count({
                  'propositionType' : LegislativePropositionTagModule.getMongoose().Types.ObjectId(legislativePropositionTypeId),
                  'description' :  { $regex: '^' + description + '$', $options: "i" }
             })
             .then(function(result){
                  if(result > 0) {
                        Utils.sendJSONresponse(res, 200, { exists: true });
                  } else {
                        Utils.sendJSONresponse(res, 200, { exists: false });
                  }
             });
      } else {
         Utils.sendJSONresponse(res, 400, { message: 'undefined description' });
      }
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined username' });
   }
}
