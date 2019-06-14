/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Minio = require('minio');
var config = require('config');
var LicitacaoEventModule = require('../models/LicitacaoEvent.js');
var LicitacaoEvent = LicitacaoEventModule.getModel();
var LicitacaoModule = require('../models/Licitacao.js');
var Licitacao = LicitacaoModule.getModel();
var LicitacaoCategoryModule = require('../models/LicitacaoCategory.js');
var LicitacaoCategory = LicitacaoCategoryModule.getModel();
var Utils = require('../util/Utils.js');
var _ = require('lodash');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _camaraApiConfig = config.get("CamaraApi");

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.newLicitacao = function(req, res, next) {
   if(req.body.licitacao) {
      var licitacaoJSON = req.body.licitacao;

      var licitacao = new Licitacao();
      var now = new Date();
      licitacao.year = licitacaoJSON.year;
      licitacao.number = licitacaoJSON.number;
      licitacao.description = licitacaoJSON.description;
      licitacao.creationDate = new Date();
      licitacao.changedDate = null;
      if(licitacaoJSON.publish) {
         licitacao.state = 1; //published
         licitacao.publicationDate = new Date();
      } else {
         licitacao.state = 0; //created
         licitacao.publicationDate = null;
      }
      licitacao.category = licitacaoJSON.category;
      licitacao.events = [];

      winston.debug("Saving licitacao ...");

      licitacao.save(function(err, licitacao) {
         if(!err) {
            winston.verbose("Licitacao saved.");
            Utils.sendJSONresponse(res, 200, { message: 'licitacao saved', id: licitacao._id });
         } else {
            winston.error("Error while saving the licitacao, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao' });
   }
}

module.exports.editLicitacao = function(req, res, next) {
   if(req.body.licitacao) {
      var licitacaoJSON = req.body.licitacao;

      Licitacao.findById({ _id: licitacaoJSON.id })
               .then( function(licitacao) {
         if(licitacao) {
            var now = new Date();
            licitacao.description = licitacaoJSON.description;
            licitacao.category = licitacaoJSON.category;
            licitacao.changedDate = now;

            winston.debug("Saving licitacao ...");

            licitacao.save(function(err, licitacao) {
               if(!err) {
                  winston.verbose("Licitacao saved.");
                  Utils.sendJSONresponse(res, 200, { message: 'licitacao saved', id: licitacao._id });
               } else {
                  winston.error("Error while saving the licitacao, err = [%s]", err);
                  Utils.next(400, err, next);
               }
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'licitacao not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao' });
   }
}

module.exports.removeLicitacao = function(req, res, next) {
   if(req.params.licitacaoId) {
      var licitacaoId = req.params.licitacaoId;
      var deleteEventCommands = [];

      Licitacao.findById({ _id: licitacaoId }).then( function(licitacao) {
         if(licitacao) {
            var i;
            //build an array containing the delete commands
            if (licitacao.events) {
               for(i = 0; i < licitacao.events.length; i++) {
                  var eventToBeDeleted = licitacao.events[i];
                  deleteEventCommands.push({
                     deleteOne: {
                       filter: { '_id':  LicitacaoEventModule.getMongoose().Types.ObjectId(eventToBeDeleted.id) }
                     }
                  });
               }
            }
            //remove events then request to remove the events
            licitacao.remove()
                     .then(function(licitacaoRemoved) {
                        //remove the events
                        if (deleteEventCommands.length > 0) {
                           //the bulk only can be executed if there is some command
                           return LicitacaoEvent.bulkWrite(deleteEventCommands);
                        } else {
                           return null;
                        }
                     }).then(function(result) {
                        winston.verbose("Licitacao removed.");
                        Utils.sendJSONresponse(res, 200, { message: 'licitacao removed' });
                     }).catch(function(err) {
                        winston.error("Error while deleting the licitacao, err = [%s]", err);
                        Utils.next(400, err, next);
                     });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'licitacao not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao id' });
   }
}

module.exports.getLicitacoes = function(req, res, next) {
   //pagination options
   var page = req.query.page ? parseInt(req.query.page) : 1;
   var pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
   var keywords = req.query.keywords ?  req.query.keywords : null;
   var number = req.query.number ?  parseInt(req.query.number) : null;
   var year = req.query.year ?  parseInt(req.query.year) : null;
   var publicationDate1 = req.query.publicationDate1 ?  req.query.publicationDate1 : null;
   var publicationDate2 = req.query.publicationDate2 ?  req.query.publicationDate2 : null;
   var state = req.query.state ?  req.query.state : null;
   var category = req.query.category ?  req.query.category : null;
   var sortField = req.query.sort ?  req.query.sort : null;
   var sortDirection = req.query.sortDirection ?  req.query.sortDirection : 1;
   var sortOptions = { publicationDate: -1,
                       creationDate: -1,
                       changedDate: -1 }

   //filter options
   var filter = { };
   var filterAnd = [];
   filter['$and'] = filterAnd;

   var keywordsWords = [];
   var k;

   if (keywords) {
      keywordsWords = _.words(keywords);
      if (keywordsWords) {
         for (k = 0; k < keywordsWords.length; k++) {
            keywordsRegex = new RegExp(keywordsWords[k], "i");
            filterAnd.push({ description : { $regex : keywordsRegex } });
         }
      }
   }

   if(number && number > 0) {
      filterAnd.push({ 'number': number });
   }
   if(year && year > 0) {
      filterAnd.push({ 'year': year });
   }
   if(publicationDate1) {
      filterAnd.push({ 'publicationDate': { '$gte' : publicationDate1 } });
   }
   if(publicationDate2) {
      filterAnd.push({ 'publicationDate': { '$lte' : publicationDate2 } });
   }
   if(state) {
      filterAnd.push({ 'state' : state });
   }
   if(category) {
      filterAnd.push({ 'category' : LicitacaoModule.getMongoose().Types.ObjectId(category) });
   }
   //set sort options
   if(sortField) {
      if(sortField === 'number') {
         sortOptions = { 'year': sortDirection,
                         'number': sortDirection,
                         'creationDate': sortDirection };
      } else if(sortField === 'creationDate') {
         sortOptions = { 'creationDate': sortDirection,
                         'publicationDate': sortDirection,
                         'changedDate': sortDirection };
      } else if(sortField === 'publicationDate') {
         sortOptions = { 'publicationDate': sortDirection,
                         'creationDate': sortDirection,
                         'changedDate': sortDirection };
      }  else if(sortField === 'changedDate') {
         sortOptions = { 'changedDate': sortDirection,
                         'publicationDate': sortDirection,
                         'creationDate': sortDirection };
      } else if(sortField === 'category') {
         sortOptions = { 'category': sortDirection,
                         'creationDate': sortDirection };
      } else if(sortField === 'state') {
         sortOptions = { 'state': sortDirection,
                         'creationDate': sortDirection };
      }
   }

   //if there is just one statement, then remove the "and" clausule
   if(filterAnd.length === 0) {
      filter = { };
   } else if(filterAnd.length === 1) {
      filter = filterAnd[0];
   }

   //id filter
   if(req.query.id) {
      filter = { _id : LicitacaoModule.getMongoose().Types.ObjectId(req.query.id) }
   }

   var stateDescriptionMap = {
      0: "Criado",
      1: "Publicado",
      2: "Despublicado"
   }

   var categoriesMap = {};

   LicitacaoCategory.find({}).then(function(categories) {
      if (categories) {
         var i;
         for(i = 0; i < categories.length; i++) {
            var category = categories[i];
            categoriesMap[category._id] = category.description;
         }
      }
      return Licitacao.count(filter);
   }).then(function(count) {
      if(count > 0) {
         if(page * pageSize - pageSize >= count) {
            page = Math.ceil(count / pageSize); //last page
         }
         return Licitacao.find(filter)
                 .sort(sortOptions)
                 .skip(page * pageSize - pageSize)
                 .limit(pageSize)
                 .then(function(licitacoes) {
                      var returnLicitacoes = [];
                      if(licitacoes) {
                         var i;
                         for(i = 0; i < licitacoes.length; i++) {
                            var licitacao = licitacoes[i];
                            returnLicitacoes.push({
                               '_id' : licitacao._id,
                               'number' : licitacao.number,
                               'year' : licitacao.year,
                               'description' : licitacao.description,
                               'publicationDate' : licitacao.publicationDate,
                               'creationDate' : licitacao.creationDate,
                               'changedDate' : licitacao.changedDate,
                               'categoryId' : licitacao.category,
                               'categoryDescription' : categoriesMap[licitacao.category] ? categoriesMap[licitacao.category] : '',
                               'state' : licitacao.state,
                               'stateDescription' : stateDescriptionMap[licitacao.state] ? stateDescriptionMap[licitacao.state] : ''
                            });
                         }
                      }

                      return {
                         "licitacoes" : returnLicitacoes,
                         "totalLength": count,
                         "page": page,
                         "pageSize": pageSize
                      };
                 });
      } else {
         return {
            "licitacoes" : [],
            "totalLength": 0,
            "page": 1,
            "pageSize": 1
         }
      }
   }).then(function(result) {
      Utils.sendJSONresponse(res, 200, result);
   }).catch(function(err) {
      winston.error("Error while getting licitacoes, err = [%s]", err);
      Utils.next(400, err, next);
   });
}

//return the last licitacoes events
module.exports.getLastLicitacoesEvents = function(req, res, next) {
   var lastSize = req.query.size ? parseInt(req.query.size) : 5;
   LicitacaoEvent
      .find()
      .sort({ date: -1 })
      .populate('licitacao')
      .deepPopulate('licitacao.category')
      .then(function(events) {
         //return just published and until the limit
         var revents = [];
         if(events) {
            var i = 0;
            for(i = 0; i < events.length && revents.length < lastSize; i++) {
               var event = events[i];
               if(event.licitacao.state === 1) {
                  revents.push(event);
               }
            }
         }
         Utils.sendJSONresponse(res, 200, revents);
      }).catch(function(err) {
         winston.error("Error while getting last licitacoes events, err = [%s]", err);
         Utils.next(400, err, next);
      });
}

//return all licitacoes events, for indexing purpose
module.exports.getAllLicitacoesEvents = function(req, res, next) {
   //pagination options
   var page = req.query.page ? parseInt(req.query.page) : 1;
   var pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;

   return LicitacaoEvent
            .aggregate(
               [
                  { $lookup: {
                        from: "licitacaos",
                        localField: "licitacao",
                        foreignField: "_id",
                        as: "licitacao"
                    }
                  },
                  { $match : { "licitacao.state" : 1 } },
                  { $count: "count" }
               ]
            ).then(function(result) {
               var count = result && result.length && result.length > 0 ? result[0].count : 0;
               if (count > 0) {
                  if (page * pageSize - pageSize >= count) {
                     page = Math.ceil(count / pageSize); //last page
                  }
                  return LicitacaoEvent
                           .aggregate(
                              [
                                 { $lookup: {
                                       from: "licitacaos",
                                       localField: "licitacao",
                                       foreignField: "_id",
                                       as: "licitacao"
                                   }
                                 },
                                 { $match : { "licitacao.state" : 1 } },
                                 { $skip : page * pageSize - pageSize },
                                 { $limit : pageSize },
                                 { $unwind : "$licitacao" },
                                 { $lookup: {
                                       from: "licitacaocategories",
                                       localField: "licitacao.category",
                                       foreignField: "_id",
                                       as: "licitacao.category"
                                   }
                                 },
                                 { $unwind : "$licitacao.category" },
                              ]
                           ).then(function(licitacoesEvents) {
                              var i;
                              return {
                                 "licitacoesEvents" : licitacoesEvents,
                                 "totalLength": count,
                                 "page": page,
                                 "pageSize": pageSize
                              }
                           });
               } else {
                  return {
                     "licitacoesEvents" : [],
                     "totalLength": 0,
                     "page": 1,
                     "pageSize": 1
                  }
               }
            }).then(function(result) {
               Utils.sendJSONresponse(res, 200, result);
            }).catch(function(err) {
               winston.error("Error while getting licitacoes events, err = [%s]", err);
               Utils.next(400, err, next);
            });
}

module.exports.getLicitacao = function(req, res, next) {
   if(req.params.licitacaoId) {
      Licitacao.findOne({ _id: LicitacaoModule.getMongoose().Types.ObjectId(req.params.licitacaoId) })
               .populate({
                   path: 'events',
                   options: { sort: { date: -1, _id: -1 }}
               })
               .populate({
                   path: 'category'
               })
               .then( function(licitacao) {
                  if(licitacao) {
                     Utils.sendJSONresponse(res, 200, {
                         "licitacao" : licitacao
                     });
                  } else {
                     Utils.sendJSONresponse(res, 400, { message: 'licitacao not found' });
                  }
               }).catch(function(err) {
                  winston.error("Error while getting licitacao, err = [%s]", err);
                  Utils.next(400, err, next);
               });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao id' });
   }
}

module.exports.checkUniqueNumber = function(req, res, next) {
   if(req.params.year) {
      if(req.params.number) {
         var year = req.params.year;
         var number = req.params.number;
         Licitacao
            .count({ 'year': year,
                     'number': number })
            .exec()
            .then(function(result) {
                  if(result > 0) {
                        Utils.sendJSONresponse(res, 200, { exists: true });
                  } else {
                        Utils.sendJSONresponse(res, 200, { exists: false });
                  }
         });
      } else {
         Utils.sendJSONresponse(res, 400, { message: 'undefined number' });
      }
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined year' });
   }
}

module.exports.getNextNumberOfTheYear = function(req, res, next) {
   if(req.params.year) {
      var year = req.params.year;

      Licitacao
         .aggregate([
           { $match : { 'year' : parseInt(year) } },
           {
               $group:
               {
                    _id: "$year",
                    maxNumber: { $max: "$number" }
               }
           }
         ])
         .then(function(result) {
               if(result.length > 0) {
                     Utils.sendJSONresponse(res, 200, { 'nextNumber': result[0].maxNumber + 1 });
               } else {
                     Utils.sendJSONresponse(res, 200, { 'nextNumber': 1 });
               }
      });

   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined year' });
   }
}

module.exports.getLicitacaoEvent = function(req, res, next) {
   if(req.params.eventId) {
      LicitacaoEvent.findOne({ _id: LicitacaoModule.getMongoose().Types.ObjectId(req.params.eventId) })
                    .then( function(licitacaoEvent) {
                        if(licitacaoEvent) {
                           Utils.sendJSONresponse(res, 200, {
                               "licitacaoEvent" : licitacaoEvent
                           });
                        } else {
                           Utils.sendJSONresponse(res, 400, { message: 'licitacao event not found' });
                        }
                    }).catch(function(err) {
                        winston.error("Error while getting licitacao event , err = [%s]", err);
                        Utils.next(400, err, next);
                    });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao event id' });
   }
}

module.exports.publishLicitacao = function(req, res, next) {
   if(req.params.licitacaoId) {
      var licitacaoId = req.params.licitacaoId;

      Licitacao.findById({ _id: licitacaoId }).then( function(licitacao) {
         if(licitacao) {
            licitacao.state = 1;
            licitacao.publicationDate = new Date();
            licitacao.changedDate = new Date();
            licitacao.save().then(function(savedLicitacao) {
               winston.verbose("Licitacao published.");
               Utils.sendJSONresponse(res, 200, { message: 'licitacao published' });
            }).catch(function(err) {
               winston.error("Error while publishing the licitacao, err = [%s]", err);
               Utils.next(400, err, next);
            });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'licitacao not found' });
         }
      }).catch(function(err) {
         winston.error("Error while publishing the licitacao, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao id' });
   }
}

module.exports.unpublishLicitacao = function(req, res, next) {
   if(req.params.licitacaoId) {
      var licitacaoId = req.params.licitacaoId;

      Licitacao.findById({ _id: licitacaoId }).then( function(licitacao) {
         if(licitacao) {
            if(licitacao.state !== 0) {
               licitacao.state = 2;
               licitacao.changedDate = new Date();
               licitacao.save().then(function(savedLicitacao) {
                  winston.verbose("Licitacao unpublished.");
                  Utils.sendJSONresponse(res, 200, { message: 'licitacao unpublished' });
               }).catch(function(err) {
                  winston.error("Error while unpublishing the licitacao, err = [%s]", err);
                  Utils.next(400, err, next);
               });
            } else {
               Utils.sendJSONresponse(res, 400, { message: 'this licitacao has never been published, it is in created state' });
            }
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'licitacao not found' });
         }
      }).catch(function(err) {
         winston.error("Error while unpublishing the licitacao, err = [%s]", err);
         Utils.next(400, err, next);
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao id' });
   }
}

module.exports.newLicitacaoEvent = function(req, res, next) {
   if(req.params.licitacaoId) {
      var licitacaoId = req.params.licitacaoId;
      var licitacao = null;
      var savedLicitacaoEvent = null;

      Licitacao.findById({ _id: LicitacaoModule.getMongoose().Types.ObjectId(licitacaoId) })
               .then( function(retrivedLicitacao) {
                  if (retrivedLicitacao) {
                     licitacao = retrivedLicitacao;
                     if(req.body.licitacaoEvent) {
                        var licitacaoEventJSON = req.body.licitacaoEvent;

                        var licitacaoEvent = new LicitacaoEvent();
                        licitacaoEvent.description = licitacaoEventJSON.description;
                        licitacaoEvent.date = licitacaoEventJSON.date;
                        licitacaoEvent.creationDate = new Date();
                        licitacaoEvent.file = licitacaoEventJSON.file;
                        licitacaoEvent.originalFilename = licitacaoEventJSON.originalFilename;
                        licitacaoEvent.contentType = licitacaoEventJSON.contentType;
                        licitacaoEvent.licitacao = retrivedLicitacao;

                        winston.debug("Saving licitacao event...");

                        return licitacaoEvent.save()
                     } else {
                        Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao event' });
                        return null;
                     }
                  } else {
                     Utils.sendJSONresponse(res, 400, { message: 'licitacao not found' });
                     return null;
                  }
               })
               .then(function(rsavedLicitacaoEvent) {
                     if(rsavedLicitacaoEvent) {
                        savedLicitacaoEvent = rsavedLicitacaoEvent;
                        licitacao.events.push(savedLicitacaoEvent);
                        return licitacao.save();
                     } else {
                        return null;
                     }
               })
               .then(function(savedLicitacao) {
                  if(savedLicitacao) {
                     winston.verbose("Licitacao event saved.");
                     Utils.sendJSONresponse(res, 200, {
                        message: 'licitacao event saved',
                        id: savedLicitacaoEvent ? savedLicitacaoEvent._id : null
                     });
                  } else {
                     return null;
                  }
               })
               .catch(function(err) {
                  winston.error("Error while saving the licitacao event, err = [%s]", err);
                  Utils.next(400, err, next);
               });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao id' });
   }
}

module.exports.editLicitacaoEvent = function(req, res, next) {
   if(req.body.licitacaoEvent) {
      var licitacaoEventJSON = req.body.licitacaoEvent;

      LicitacaoEvent.findById({ _id: licitacaoEventJSON.id })
                    .then( function(licitacaoEvent) {
         if(licitacaoEvent) {
            licitacaoEvent.description = licitacaoEventJSON.description;
            licitacaoEvent.date = licitacaoEventJSON.date;
            licitacaoEvent.changedDate = new Date();
            licitacaoEvent.file = licitacaoEventJSON.file;
            licitacaoEvent.originalFilename = licitacaoEventJSON.originalFilename;
            licitacaoEvent.contentType = licitacaoEventJSON.contentType;

            winston.debug("Saving licitacao event...");

            licitacaoEvent.save()
                          .then(function(savedLicitacaoEvent) {
                              winston.verbose("Licitacao event saved.");
                              Utils.sendJSONresponse(res, 200, {
                                 message: 'licitacao event saved',
                              });
                          }).catch(function(err) {
                              winston.error("Error while saving the licitacao event, err = [%s]", err);
                              Utils.next(400, err, next);
                          });
         } else {
            Utils.sendJSONresponse(res, 400, { message: 'licitacao event not found' });
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao event' });
      return null;
   }
}

module.exports.removeLicitacaoEvent = function(req, res, next) {
   var removedFromArray = false;

   if(req.params.licitacaoId) {
      var licitacaoId = req.params.licitacaoId;
      if(req.params.eventId) {
         var eventId = LicitacaoEventModule.getMongoose().Types.ObjectId(req.params.eventId);
         Licitacao.findById({ _id: licitacaoId })
                  .then( function(licitacao) {
                     if(licitacao) {
                        //find the event in the licitacao
                        var events = licitacao.events;
                        var found = false;
                        var i;
                        var foundEvent = null;
                        var foundEventIndex = -1;
                        for(i = 0; i < events.length && foundEvent === null; i++) {
                           var event = events[i];
                           if(Utils.equalsMongoId(event.id, eventId.id)) {
                              foundEvent = event;
                              foundEventIndex = i;
                           }
                        }
                        //remove the event from array
                        if(foundEvent !== null) {
                           licitacao.events.splice(foundEventIndex, 1);
                           return licitacao.save();
                        } else {
                           Utils.sendJSONresponse(res, 400, { message: 'licitacao event not found in this licitacao' });
                           return null;
                        }
                     } else {
                        Utils.sendJSONresponse(res, 400, { message: 'licitacao not found' });
                        return null;
                     }
                  })
                  .then(function(savedLicitacao) {
                     if(savedLicitacao) {
                        removedFromArray = true;
                        return LicitacaoEvent.findById({ _id: eventId });
                     } else {
                        return null;
                     }
                  })
                  .then(function(licitacaoEvent) {
                     if (licitacaoEvent) {
                        return licitacaoEvent.remove();
                     } else {
                        return null;
                     }
                  })
                  .then(function(removedLicitacaoEvent) {
                     if(removedLicitacaoEvent || removedFromArray) {
                        winston.verbose("Licitacao removed.");
                        Utils.sendJSONresponse(res, 200, { message: 'licitacao removed' });
                     }
                  })
                  .catch(function(err) {
                     winston.error("Error while deleting the licitacao event, err = [%s]", err);
                     Utils.next(400, err, next);
                  });
      } else {
         Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao event id' });
      }
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined licitacao id' });
   }
}

module.exports.downloadEventFile = function(req, res, next) {
   if(req.params.eventId) {
      LicitacaoEvent.findOne({ _id: LicitacaoEventModule.getMongoose().Types.ObjectId(req.params.eventId) })
               .then( function(eventLicitacao) {
                  if(eventLicitacao) {
                     var s3Client = new Minio.Client(_camaraApiConfig.S3Configuration);
                     s3Client.getObject( _camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Bucket,
                                         _camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Folder  + "/" + eventLicitacao.file,

                     function(err, dataStream) {
                        if (!err) {
                           res.set({
                             'Content-Type': eventLicitacao.contentType,
                             'Content-Length': dataStream.headers['content-length'],
                             'Content-Disposition': 'inline; filename="' + eventLicitacao.originalFilename + '"'
                           });
                           var buffers = [];
                           var bufferLength = 0;
                           dataStream.on('data', function(chunk) {
                              buffers.push(chunk);
                              bufferLength += chunk.length;
                           });
                           dataStream.on('end', function() {
                              var dataFile = Buffer.concat(buffers, bufferLength);
                              res.send(dataFile);
                           });
                           dataStream.on('error', function(err) {
                              winston.error("Error while downloading licitacao event file, err = [%s]", err);
                           });
                        } else {
                           winston.error("Error while downloading licitacao event file, err = [%s]", err);
                           Utils.next(400, err, next);
                        }
                     });
                  } else {
                     Utils.sendJSONresponse(res, 400, { message: 'licitacao event not found' });
                  }
               }).catch(function(err) {
                  winston.error("Error while downloading licitacao event file [getting licitacao event object], err = [%s]", err);
                  Utils.next(400, err, next);
               });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined event id' });
   }
}

module.exports.rawDownloadEventFile = function(req, res, next) {
   if(req.params.fileName) {
         var fileName = req.params.fileName;
         var originalFilename = req.query.originalFilename ? req.query.originalFilename : fileName;
         var s3Client = new Minio.Client(_camaraApiConfig.S3Configuration);
         s3Client.getObject( _camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Bucket,
                             _camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Folder  + "/" + fileName,

         function(err, dataStream) {
            if (!err) {
               res.set({
                 'Content-Type': dataStream.headers['content-type'],
                 'Content-Length': dataStream.headers['content-length'],
                 'Content-Disposition': 'inline; filename="' + originalFilename + '"'
               });
               var buffers = [];
               var bufferLength = 0;
               dataStream.on('data', function(chunk) {
                  buffers.push(chunk);
                  bufferLength += chunk.length;
               });
               dataStream.on('end', function() {
                  var dataFile = Buffer.concat(buffers, bufferLength);
                  res.send(dataFile);
               });
               dataStream.on('error', function(err) {
                  winston.error("Error while downloading licitacao event file, err = [%s]", err);
               });
            } else {
               winston.error("Error while downloading licitacao event file, err = [%s]", err);
               Utils.next(400, err, next);
            }
         });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined filename' });
   }
}

module.exports.uploadEventFile = function(req, res, next) {
   if (!req.files) {
      Utils.sendJSONresponse(res, 400, { message: 'No files were uploaded.' });
   } else {
      var eventFile = req.files.file;
      var uuid = req.params.uuid;
      if(!uuid) {
         Utils.sendJSONresponse(res, 400, { message: 'uuid required.' });
         return;
      }
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //use the uuid as the file name
      var fileName = uuid;
      var fileNameParts = _.split(eventFile.name, '.');
      if (fileNameParts.length > 1) {
         //append the extension file
         fileName +=  "." + fileNameParts[fileNameParts.length - 1];
      }
      //send the file to S3 server
      s3Client.putObject( camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Bucket,
                          camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Folder + "/" + fileName,
                          eventFile.data,
                          eventFile.data.length,
                          eventFile.mimetype,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'file uploaded',
                                               'filename': fileName,
                                               'contentType': eventFile.mimetype
                                             });
         } else {
            winston.error("Error while uploading file of the licitacao event, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   }
}

module.exports.deleteEventFile = function(req, res, next) {
   var camaraApiConfig = config.get("CamaraApi");

   if(req.params.fileName) {
      var eventFile = req.params.fileName;
      var camaraApiConfig = config.get("CamaraApi");

      var s3Client = new Minio.Client(camaraApiConfig.S3Configuration);
      //send the file to S3 server
      s3Client.removeObject( camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Bucket,
                             camaraApiConfig.Licitacoes.s3LicitacaoEvent.s3Folder + "/" + eventFile,
      function(err, etag) {
         if(!err) {
            Utils.sendJSONresponse(res, 200, { 'message': 'the file of the licitacao event was removed', 'filename': eventFile });
         } else {
            winston.error("Error while removing the file of the licitacao event, err = [%s]", err);
            Utils.next(400, err, next);
         }
      });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined file name of the licitacao event' });
   }
}
