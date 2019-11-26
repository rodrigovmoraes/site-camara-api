/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var config = require('config');
var winston = require('winston');
var _ = require('lodash');
var UserGroup = require('../models/UserGroup.js').getModel();
var migrateSecurityRolesScript = require('./migrateSecurityRoles');

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.groups = {};

module.exports.run = async function () {
   winston.info("************migrateUserGroups");

   //Contabilidade
   userGroup = new UserGroup();
   userGroup.name = "Contabilidade";
   userGroup.completeName = "Contabilidade";
   userGroup.isRoot = true;
   userGroup.roles = [];
   userGroup.roles.push(migrateSecurityRolesScript.READ_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_LEI_RESPONSABILIDADE_FISCAL_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_LEI_FEDERAL_9755_98_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_SALARIO_SERVIDORES_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_PRESTACAO_CONTAS_ANUAL_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_ESTRUTURA_ADM_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_LISTA_PRESENCA_VEREADORES_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_ESCOLA_DO_LEGISLATIVO_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_PRESTACAO_CONTAS_VEREADORES);

   await userGroup.save();
   module.exports.groups[2] = userGroup;

   //Imprensa
   userGroup = new UserGroup();
   userGroup.name = "Imprensa";
   userGroup.completeName = "Imprensa";
   userGroup.isRoot = true;
   userGroup.roles = [];
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_MENU_PORTAL);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_MENU_PORTAL);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_NEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_NEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_PAGE);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_PAGE);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_PAGE);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_BANNER);
   userGroup.roles.push(migrateSecurityRolesScript.READ_BANNER);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_BANNER);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_HOTNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_HOTNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_HOTNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_FIXED_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_FIXED_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_FIXED_BREAKINGNEWS);
   await userGroup.save();
   module.exports.groups[3] = userGroup;

   //Secretaria
   userGroup = new UserGroup();
   userGroup.name = "Secretaria";
   userGroup.completeName = "Secretaria";
   userGroup.isRoot = true;
   userGroup.roles = [];
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_LEGISLATIVE_PROPOSITION);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_LEGISLATIVE_PROPOSITION);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION_TAG);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_LEGISLATIVE_PROPOSITION_TAG);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_LEGISLATIVE_PROPOSITION_TAG);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION_RELATIONSHIP_TYPE);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_ATAS_DAS_SESSOES_PUBLIC_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER);
   userGroup.roles.push(migrateSecurityRolesScript.READ_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_PUBLIC_FILES);
   await userGroup.save();
   module.exports.groups[5] = userGroup;

   //Licitacao
   userGroup = new UserGroup();
   userGroup.name = "Licitacao";
   userGroup.completeName = "Licitação";
   userGroup.isRoot = true;
   userGroup.roles = [];
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_LICITACAO);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_LICITACAO);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LICITACAO);
   await userGroup.save();
   module.exports.groups[4] = userGroup;

   //Informática
   userGroup = new UserGroup();
   userGroup.name = "Informatica";
   userGroup.completeName = "Informática";
   userGroup.isRoot = true;
   userGroup.roles = [];
   userGroup.roles.push(migrateSecurityRolesScript.READ_USER);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_USER);
   userGroup.roles.push(migrateSecurityRolesScript.READ_USER_GROUP);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_USER_GROUP);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_USER_GROUP);
   userGroup.roles.push(migrateSecurityRolesScript.READ_MENU_ADMIN);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_MENU_ADMIN);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_MENU_ADMIN);
   userGroup.roles.push(migrateSecurityRolesScript.READ_SECURITY_ROLES);
   userGroup.roles.push(migrateSecurityRolesScript.MANAGE_SEARCH_INDEX);
   //--
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_LICITACAO);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_LICITACAO);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LICITACAO);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_LEGISLATIVE_PROPOSITION);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_LEGISLATIVE_PROPOSITION);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION_TAG);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_LEGISLATIVE_PROPOSITION_TAG);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_LEGISLATIVE_PROPOSITION_TAG);
   userGroup.roles.push(migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION_RELATIONSHIP_TYPE);
   userGroup.roles.push(migrateSecurityRolesScript.READ_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_PUBLIC_FILES);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_MENU_PORTAL);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_MENU_PORTAL);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_NEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_NEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_PAGE);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_PAGE);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_PAGE);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_BANNER);
   userGroup.roles.push(migrateSecurityRolesScript.READ_BANNER);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_BANNER);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_HOTNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_HOTNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_HOTNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_FIXED_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.READ_FIXED_BREAKINGNEWS);
   userGroup.roles.push(migrateSecurityRolesScript.DELETE_FIXED_BREAKINGNEWS);
   //--
   userGroup.roles.push(migrateSecurityRolesScript.VIEW_ALL_PUBLIC_FILES);
   //--
   userGroup.roles.push(migrateSecurityRolesScript.PURGE_CACHE);

   await userGroup.save();
   module.exports.groups[1] = userGroup;

   //Cerimonial
   userGroup = new UserGroup();
   userGroup.name = "Cerimonial";
   userGroup.completeName = "Cerimonial";
   userGroup.isRoot = true;
   userGroup.roles = [];
   userGroup.roles.push(migrateSecurityRolesScript.WRITE_EVENTS);
   await userGroup.save();

   return Promise.resolve(true);
}
