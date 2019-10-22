/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var config = require('config');
var winston = require('winston');
var _ = require('lodash');
var SecurityRole = require('../models/SecurityRole.js').getModel();

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateSecurityRoles");

   //users roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_USER";
   await securityRoles.save();
   module.exports.READ_USER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_USER";
   await securityRoles.save();
   module.exports.WRITE_USER = securityRoles;

   //user group roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_USER_GROUP";
   await securityRoles.save();
   module.exports.READ_USER_GROUP = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_USER_GROUP";
   await securityRoles.save();
   module.exports.WRITE_USER_GROUP = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_USER_GROUP";
   await securityRoles.save();
   module.exports.DELETE_USER_GROUP = securityRoles;

   //menu admin roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_MENU_ADMIN";
   await securityRoles.save();
   module.exports.READ_MENU_ADMIN = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_MENU_ADMIN";
   await securityRoles.save();
   module.exports.WRITE_MENU_ADMIN = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_MENU_ADMIN";
   await securityRoles.save();
   module.exports.DELETE_MENU_ADMIN = securityRoles;

   //menu portal roles
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_MENU_PORTAL";
   await securityRoles.save();
   module.exports.WRITE_MENU_PORTAL = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_MENU_PORTAL";
   await securityRoles.save();
   module.exports.DELETE_MENU_PORTAL = securityRoles;

   //news roles
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_NEWS";
   await securityRoles.save();
   module.exports.WRITE_NEWS = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_NEWS";
   await securityRoles.save();
   module.exports.DELETE_NEWS = securityRoles;

   //page roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_PAGE";
   await securityRoles.save();
   module.exports.READ_PAGE = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_PAGE";
   await securityRoles.save();
   module.exports.WRITE_PAGE = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_PAGE";
   await securityRoles.save();
   module.exports.DELETE_PAGE = securityRoles;

   //banner roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_BANNER";
   await securityRoles.save();
   module.exports.READ_BANNER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_BANNER";
   await securityRoles.save();
   module.exports.WRITE_BANNER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_BANNER";
   await securityRoles.save();
   module.exports.DELETE_BANNER = securityRoles;

   //hotnews roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_HOTNEWS";
   await securityRoles.save();
   module.exports.READ_HOTNEWS = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_HOTNEWS";
   await securityRoles.save();
   module.exports.WRITE_HOTNEWS = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_HOTNEWS";
   await securityRoles.save();
   module.exports.DELETE_HOTNEWS = securityRoles;


   //breaking news roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_BREAKINGNEWS";
   await securityRoles.save();
   module.exports.READ_BREAKINGNEWS = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_BREAKINGNEWS";
   await securityRoles.save();
   module.exports.WRITE_BREAKINGNEWS = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_BREAKINGNEWS";
   await securityRoles.save();
   module.exports.DELETE_BREAKINGNEWS = securityRoles;

   //fixed breaking news roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_FIXED_BREAKINGNEWS";
   await securityRoles.save();
   module.exports.READ_FIXED_BREAKINGNEWS = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_FIXED_BREAKINGNEWS";
   await securityRoles.save();
   module.exports.WRITE_FIXED_BREAKINGNEWS = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_FIXED_BREAKINGNEWS";
   await securityRoles.save();
   module.exports.DELETE_FIXED_BREAKINGNEWS = securityRoles;

   //events roles
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_EVENTS";
   await securityRoles.save();
   module.exports.WRITE_EVENTS = securityRoles;

   //licitacao roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_LICITACAO";
   await securityRoles.save();
   module.exports.READ_LICITACAO = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_LICITACAO";
   await securityRoles.save();
   module.exports.WRITE_LICITACAO = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_LICITACAO";
   await securityRoles.save();
   module.exports.DELETE_LICITACAO = securityRoles;

   //legislative proposition roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_LEGISLATIVE_PROPOSITION";
   await securityRoles.save();
   module.exports.READ_LEGISLATIVE_PROPOSITION = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_LEGISLATIVE_PROPOSITION";
   await securityRoles.save();
   module.exports.WRITE_LEGISLATIVE_PROPOSITION = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_LEGISLATIVE_PROPOSITION";
   await securityRoles.save();
   module.exports.DELETE_LEGISLATIVE_PROPOSITION = securityRoles;

   //legislative proposition tag
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_LEGISLATIVE_PROPOSITION_TAG";
   await securityRoles.save();
   module.exports.READ_LEGISLATIVE_PROPOSITION_TAG = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_LEGISLATIVE_PROPOSITION_TAG";
   await securityRoles.save();
   module.exports.WRITE_LEGISLATIVE_PROPOSITION_TAG = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_LEGISLATIVE_PROPOSITION_TAG";
   await securityRoles.save();
   module.exports.DELETE_LEGISLATIVE_PROPOSITION_TAG = securityRoles;

   //legislative proposition relationship type
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_LEGISLATIVE_PROPOSITION_RELATIONSHIP_TYPE";
   await securityRoles.save();
   module.exports.READ_LEGISLATIVE_PROPOSITION_RELATIONSHIP_TYPE = securityRoles;

   //public files
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_PUBLIC_FILES";
   await securityRoles.save();
   module.exports.READ_PUBLIC_FILES = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "WRITE_PUBLIC_FILES";
   await securityRoles.save();
   module.exports.WRITE_PUBLIC_FILES = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "DELETE_PUBLIC_FILES";
   await securityRoles.save();
   module.exports.DELETE_PUBLIC_FILES = securityRoles;

   //security roles roles
   securityRoles = new SecurityRole();
   securityRoles.name = "READ_SECURITY_ROLES";
   await securityRoles.save();
   module.exports.READ_SECURITY_ROLES = securityRoles;

   //manage search index role
   securityRoles = new SecurityRole();
   securityRoles.name = "MANAGE_SEARCH_INDEX";
   await securityRoles.save();
   module.exports.MANAGE_SEARCH_INDEX = securityRoles;

   //public files roles
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_ATAS_DAS_SESSOES_PUBLIC_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_ATAS_DAS_SESSOES_PUBLIC_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_LEI_RESPONSABILIDADE_FISCAL_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_LEI_RESPONSABILIDADE_FISCAL_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_LEI_FEDERAL_9755_98_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_LEI_FEDERAL_9755_98_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_SALARIO_SERVIDORES_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_SALARIO_SERVIDORES_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_PRESTACAO_CONTAS_ANUAL_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_PRESTACAO_CONTAS_ANUAL_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_ESTRUTURA_ADM_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_ESTRUTURA_ADM_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_LISTA_PRESENCA_VEREADORES_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_LISTA_PRESENCA_VEREADORES_FOLDER = securityRoles;
   securityRoles = new SecurityRole();
   //--
   securityRoles.name = "VIEW_PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_ESCOLA_DO_LEGISLATIVO_FOLDER";
   await securityRoles.save();
   module.exports.VIEW_ESCOLA_DO_LEGISLATIVO_FOLDER = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_PRESTACAO_CONTAS_VEREADORES";
   await securityRoles.save();
   module.exports.VIEW_PRESTACAO_CONTAS_VEREADORES = securityRoles;
   //--
   securityRoles = new SecurityRole();
   securityRoles.name = "VIEW_ALL_PUBLIC_FILES";
   await securityRoles.save();
   module.exports.VIEW_ALL_PUBLIC_FILES = securityRoles;

   return Promise.resolve(true);
}
