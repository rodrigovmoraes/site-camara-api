/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var LicitacaoCategoryModule = require('../models/LicitacaoCategory.js');
var LicitacaoCategory = LicitacaoCategoryModule.getModel();
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

module.exports.getLicitacoesCategories = function(req, res, next) {
   LicitacaoCategory.find({}).then(function(categories) {
      Utils.sendJSONresponse(res, 200, {
         'categories' : categories
      });
   }).catch(function(err) {
      winston.error("Error while getting licitacoes categories, err = [%s]", err);
      Utils.next(400, err, next);
   });
}
