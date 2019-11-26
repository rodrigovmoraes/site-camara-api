/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var config = require('config');
var winston = require('winston');
var _ = require('lodash');
var MenuAdminModule = require('../models/MenuAdmin.js');
var MenuAdmin = MenuAdminModule.getModel();
var migrateSecurityRolesScript = require('./migrateSecurityRoles.js');
var migratePrestaContas = require('./migratePrestaContas.js');
var migratePublicFiles = require('./migratePublicFiles.js');

//conts
var ATAS_DAS_SESSOES_PUBLIC_FOLDER = 372;
var REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER = 409;

var LEI_RESPONSABILIDADE_FISCAL_FOLDER = 20;
var LEI_FEDERAL_9755_98_FOLDER = 30;
var SALARIO_SERVIDORES_FOLDER = 280;
var PRESTACAO_CONTAS_ANUAL_FOLDER = 305;
var VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER = 312;

var ESTRUTURA_ADM_FOLDER = 289;
var LISTA_PRESENCA_VEREADORES_FOLDER = 290;
var PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER = 328;
var ESCOLA_DO_LEGISLATIVO_FOLDER = 377;
/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

var _getMenuItemsArr = function() {
   var folder_ATAS_DAS_SESSOES_PUBLIC_FOLDER = migratePublicFiles.getFolder(ATAS_DAS_SESSOES_PUBLIC_FOLDER);
   var folder_REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER = migratePublicFiles.getFolder(REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER);

   var folder_LEI_RESPONSABILIDADE_FISCAL_FOLDER = migratePublicFiles.getFolder(LEI_RESPONSABILIDADE_FISCAL_FOLDER);
   var folder_LEI_FEDERAL_9755_98_FOLDER = migratePublicFiles.getFolder(LEI_FEDERAL_9755_98_FOLDER);
   var folder_SALARIO_SERVIDORES_FOLDER = migratePublicFiles.getFolder(SALARIO_SERVIDORES_FOLDER);
   var folder_PRESTACAO_CONTAS_ANUAL_FOLDER = migratePublicFiles.getFolder(PRESTACAO_CONTAS_ANUAL_FOLDER);
   var folder_VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER = migratePublicFiles.getFolder(VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER);

   var folder_ESTRUTURA_ADM_FOLDER = migratePublicFiles.getFolder(ESTRUTURA_ADM_FOLDER);
   var folder_LISTA_PRESENCA_VEREADORES_FOLDER = migratePublicFiles.getFolder(LISTA_PRESENCA_VEREADORES_FOLDER);
   var folder_PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER = migratePublicFiles.getFolder(PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER);
   var folder_ESCOLA_DO_LEGISLATIVO_FOLDER = migratePublicFiles.getFolder(ESCOLA_DO_LEGISLATIVO_FOLDER);
   var folder_PRESTACAO_CONTAS_VEREADORES = migratePrestaContas.getPrestaContasFolder();

   //menu defition
   var menuItemsArr =  [
                        {  title: 'Home',
                           sref:  'dashboard',
                           icon:  'icon-home',
                           isRoot: true,
                           order: 0
                        },
                        { title: 'Usuários',
                          icon: 'icon-user',
                          sref: 'users',
                          order: 1,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_USER
                        },
                        { title: 'Grupos de usuários',
                          icon: 'icon-grid',
                          sref: 'userGroups',
                          order: 2,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_USER_GROUP
                        },
                        { title: 'Menu - Admin',
                          icon: 'icon-film',
                          sref: 'menuAdmin.list',
                          order: 3,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_MENU_ADMIN
                       },{ title: 'Menu - Portal',
                          icon: 'icon-list',
                          sref: 'menuPortal.list',
                          order: 4,
                          isRoot: true,
                          role: migrateSecurityRolesScript.WRITE_MENU_PORTAL
                        },
                        { title: 'Notícias',
                          icon: 'icon-docs',
                          sref: 'newsItem.list',
                          order: 5,
                          isRoot: true,
                          role: migrateSecurityRolesScript.WRITE_NEWS
                        },
                        { title: 'Páginas',
                          icon: 'icon-globe',
                          sref: 'page.list',
                          order: 6,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_PAGE
                        },{ title: 'Banners',
                          icon: 'icon-frame',
                          sref: 'banner.list',
                          order: 7,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_BANNER
                       },{ title: 'Destaques Cabeçalho',
                          icon: 'icon-energy',
                          sref: 'hotNews.list',
                          order: 8,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_HOTNEWS
                       },{ title: 'Destaques Rotativos',
                          icon: 'icon-star',
                          sref: 'breakingNews.list',
                          order: 9,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_BREAKINGNEWS
                       },{ title: 'Destaques Fixos',
                          icon: 'icon-direction',
                          sref: 'fixedBreakingNews.list',
                          order: 10,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_FIXED_BREAKINGNEWS
                       },{ title: 'Eventos',
                          icon: 'icon-calendar',
                          sref: 'eventsCalendar.list',
                          order: 11,
                          isRoot: true,
                          role: migrateSecurityRolesScript.WRITE_EVENTS
                       }, { title: 'Licitações',
                          icon: 'icon-basket',
                          sref: 'licitacao.list',
                          order: 12,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_LICITACAO
                       }, { title: 'Proposituras',
                          icon: 'icon-graduation',
                          sref: 'legislativeProposition.list',
                          order: 13,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION
                       },{ title: 'Classificações',
                          icon: 'icon-tag',
                          sref: 'legislativePropositionTags',
                          order: 14,
                          isRoot: true,
                          role: migrateSecurityRolesScript.READ_LEGISLATIVE_PROPOSITION_TAG
                       },
                       { title: 'Índice',
                         icon: 'icon-magnifier',
                         sref: 'indexer',
                         order: 15,
                         isRoot: true,
                         role: migrateSecurityRolesScript.MANAGE_SEARCH_INDEX
                      },
                      {  title: 'Atas das Sessões',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_ATAS_DAS_SESSOES_PUBLIC_FOLDER._id + '\'})',
                         order: 16,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_ATAS_DAS_SESSOES_PUBLIC_FOLDER
                      },
                      {  title: 'Requerimentos Verbais',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER._id + '\'})',
                         order: 17,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER
                      },
                      {  title: 'Lei Responsabilidade Fiscal',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_LEI_RESPONSABILIDADE_FISCAL_FOLDER._id + '\'})',
                         order: 18,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_LEI_RESPONSABILIDADE_FISCAL_FOLDER
                      },
                      {  title: 'Lei Federal 9755/98',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_LEI_FEDERAL_9755_98_FOLDER._id + '\'})',
                         order: 19,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_LEI_FEDERAL_9755_98_FOLDER
                      },
                      {  title: 'Salários dos Servidores',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_SALARIO_SERVIDORES_FOLDER._id + '\'})',
                         order: 20,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_SALARIO_SERVIDORES_FOLDER
                      },
                      {  title: 'Valor de Subsí­dio e Remuneração de Cargos e Empregos Públicos',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER._id + '\'})',
                         order: 21,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER
                      },
                      {  title: 'Estrutura Administrativa da Câmara',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_ESTRUTURA_ADM_FOLDER._id + '\'})',
                         order: 22,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_ESTRUTURA_ADM_FOLDER
                      },
                      {  title: 'Lista de presença dos Vereadores',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_LISTA_PRESENCA_VEREADORES_FOLDER._id + '\'})',
                         order: 23,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_LISTA_PRESENCA_VEREADORES_FOLDER
                      },
                      {  title: 'Programa Câmara de Bairro em Bairro',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER._id + '\'})',
                         order: 24,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_PROGRAMA_BAIRRO_EM_BAIRRO_FOLDER
                      },
                      {  title: 'Escola do Legislativo',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_ESCOLA_DO_LEGISLATIVO_FOLDER._id + '\'})',
                         order: 25,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_ESCOLA_DO_LEGISLATIVO_FOLDER
                      },
                      {  title: 'Prestação Contas Vereadores',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list({ folderId: \'' + folder_PRESTACAO_CONTAS_VEREADORES._id + '\'})',
                         order: 26,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_PRESTACAO_CONTAS_VEREADORES
                      },
                      {  title: 'Arquivos Públicos',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list',
                         order: 27,
                         isRoot: true,
                         role: migrateSecurityRolesScript.VIEW_ALL_PUBLIC_FILES
                      },
                      {  title: 'Limpeza de Cache',
                         icon: 'icon-folder-alt',
                         sref: 'publicFiles.list',
                         order: 28,
                         isRoot: true,
                         role: migrateSecurityRolesScript.PURGE_CACHE
                      }
                   ];
      return menuItemsArr;
}


//*****************************************************************************
//process a menu item
var _processMenuItemAdmin = async function(rootMenuItem, prmIsRoot) {
   var isRoot = prmIsRoot !== undefined ? prmIsRoot : false;

   if(rootMenuItem.menuItems && rootMenuItem.menuItems.length > 0) {
      var i;
      var childrenIds = [];
      for(i = 0; i < rootMenuItem.menuItems.length; i++) {
         var childMenuItem = rootMenuItem.menuItems[i];
         var id = await new Promise(function(resolve, reject) {
            _processMenuItemAdmin(childMenuItem).then(function(result) {
               resolve(result);
            }).catch(function(err) {
               reject(err);
            });
         });
         childrenIds.push(id);
      }
      var menuItem = new MenuAdmin();
      menuItem.title = rootMenuItem.title;
      menuItem.sref = rootMenuItem.sref;
      menuItem.icon = rootMenuItem.icon;
      menuItem.isRoot = isRoot;
      menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
      menuItem.menuItems = childrenIds;
      menuItem.role = rootMenuItem.role !== undefined ? rootMenuItem.role : null;
      var id = await new Promise(function(resolve, reject) {
         menuItem.save().then(function(result) {
            resolve(result._id);
         }).catch(function(err) {
            reject(err);
         });
      });
      return id;
   } else {
      var menuItem = new MenuAdmin();
      menuItem.title = rootMenuItem.title;
      menuItem.sref = rootMenuItem.sref;
      menuItem.icon = rootMenuItem.icon;
      menuItem.isRoot = isRoot;
      menuItem.order = rootMenuItem.order !== undefined ? rootMenuItem.order : -1;
      menuItem.menuItems = [];
      menuItem.role = rootMenuItem.role !== undefined ? rootMenuItem.role : null;
      var id = await new Promise(function(resolve, reject) {
         menuItem.save().then(function(result) {
            resolve(result._id);
         }).catch(function(err) {
            reject(err);
         });
      });
      return id;
   }
}

//process the root menu items
var _processMenuAdmin = async function(menuAdmin) {
   if(menuAdmin) {
      var i;
      for (i = 0; i < menuAdmin.length; i++) {
         var menuItem = menuAdmin[i];
         var id = await new Promise(function(resolve, reject) {
            _processMenuItemAdmin(menuItem, true).then(function(result) {
               resolve(result);
            }).catch(function(err) {
               reject(err);
            });
         });
      }
      return true;
   }
}

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateMenuAdmin");

      //do the job
      return new Promise(function(resolve, reject) {
         var menuItemsArr = _getMenuItemsArr();
         _processMenuAdmin(menuItemsArr).then(function(result) {
            winston.verbose("Menu admin created.");
            resolve(true);
         }).catch(function(err) {
            reject(err);
         });
      });
}
