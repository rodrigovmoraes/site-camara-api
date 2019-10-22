/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var urlDownloadImage = "http://www.camarasorocaba.sp.gov.br/arquivos/fotos_noticias/";

var config = require('config');
var winston = require('winston');
var _ = require('lodash');
var createUserScript = require('./createUser');
var MenuPortalModule = require('../models/MenuPortal.js');
var MenuPortal = MenuPortalModule.getModel();
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

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

//type link, news, page, flickr, youtube
var migrateMenuPortalItem = async function (title, url, isRoot, order, type, access) {
   var menuItem = new MenuPortal();
   menuItem.title = title;
   menuItem.url = null;
   menuItem.isRoot = isRoot;
   menuItem.order = order;
   menuItem.menuItems = [];
   menuItem.type = type;
   menuItem.access = access;

   var savedMenuItem = await new Promise(function(resolve, reject) {
      menuItem.save().then(function(result) {
         resolve(result);
      }).catch(function(err) {
         reject(err);
      });
   });
   return savedMenuItem;
}

//*****************************************************************************
var _migrate = async function () {
   try {
      //**************************Principal**************************
      var principalMenuItem = await migrateMenuPortalItem("Principal", null, true, 0, null, null);
         var paginaPrincipalMenuItem = await migrateMenuPortalItem("Página Principal", null, false, 0, "link", { "url" : "/", "target" : "_parent" });
         var conhecaACamaraMenuItem = await migrateMenuPortalItem("Conheça a Câmara", null, false, 1, "link", { "url" : "/page.html?tag=conhecacamara", "target" : "_parent" });
         var linksMenuItem = await migrateMenuPortalItem("Links", null, false, 2, "link", { "url" : "/page.html?tag=links", "target" : "_parent" });
         var comoChegarMenuItem = await migrateMenuPortalItem("Como Chegar", null, false, 3, "link", { "url" : "/page.html?tag=comochegar", "target" : "_parent" });
         var faleConoscoMenuItem = await migrateMenuPortalItem("Fale Conosco", null, false, 4, "link", { "url" : "/page.html?tag=faleconosco", "target" : "_parent" });
         var acessoInterno = await migrateMenuPortalItem("Acesso Interno", null, false, 5, "link", { "url" : "http://www.topdata-info.com.br/portal/rhcamara_sorocaba/", "target" : "_blank" });
         principalMenuItem.menuItems.push(paginaPrincipalMenuItem);
         principalMenuItem.menuItems.push(conhecaACamaraMenuItem);
         principalMenuItem.menuItems.push(linksMenuItem);
         principalMenuItem.menuItems.push(comoChegarMenuItem);
         principalMenuItem.menuItems.push(faleConoscoMenuItem);
         principalMenuItem.menuItems.push(acessoInterno);
         await principalMenuItem.save();
      //**************************Vereadores**************************
      var vereadoresMenuItem = await migrateMenuPortalItem("Vereadores", null, true, 1, null, null);
         var perfisHistoricosMenuItem = await migrateMenuPortalItem("Histórico dos Vereadores", null, false, 0, "link", { "url" : "/vereadores.html", "target" : "_parent" });
         var mesaDiretoraMenuItem = await migrateMenuPortalItem("Mesa Diretora", null, false, 1, "link", { "url" : "/mesa_diretora.html", "target" : "_parent" });
         var comissoesMenuItem = await migrateMenuPortalItem("Comissões", null, false, 2, "link", { "url" : "/comissoes.html", "target" : "_parent" });
         var prestaContasFolder = migratePrestaContas.getPrestaContasFolder();
         var prestacaoContasMenuItem;
         if (prestaContasFolder) {
            prestacaoContasMenuItem = await migrateMenuPortalItem("Prestação de Contas", null, false, 3, "link", { "url" : "/arquivos_publicos.html?id=" + prestaContasFolder._id, "target" : "_parent" });
         } else {
            prestacaoContasMenuItem = await migrateMenuPortalItem("Prestação de Contas", null, false, 3, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }
         vereadoresMenuItem.menuItems.push(perfisHistoricosMenuItem);
         vereadoresMenuItem.menuItems.push(mesaDiretoraMenuItem);
         vereadoresMenuItem.menuItems.push(comissoesMenuItem);
         vereadoresMenuItem.menuItems.push(prestacaoContasMenuItem);
         await vereadoresMenuItem.save();
      //*******************Atividades Legislativas********************
      var atividadesLegislativasMenuItem = await migrateMenuPortalItem("Atividades Legislativas", null, true, 2, null, null);
         var materiasLegislativasMenuItem = await migrateMenuPortalItem("Matérias Legislativas", null, false, 0, "link", { "url" : "/materias.html", "target" : "_parent" });
         var pesquisaAvancadaMateriasLegislativasMenuItem = await migrateMenuPortalItem("Pesquisa Avançada Matérias Legislativas", null, false, 1, "link", { "url" : "http://www.camarasorocaba.sp.gov.br:8383/syslegis/materiaLegislativa/relatorioMateriasAgrupadas", "target" : "_blank" });
         var pautasSessoesMenuItem = await migrateMenuPortalItem("Pautas das Sessões", null, false, 2, "link", { "url" : "/ordens_do_dia.html", "target" : "_parent" });
         //atas das sessoes
         var atasDasSessoesFolder = migratePublicFiles.getFolder(ATAS_DAS_SESSOES_PUBLIC_FOLDER);
         var atasDasSessoesMenuItem;
         if (atasDasSessoesFolder) {
            atasDasSessoesMenuItem = await migrateMenuPortalItem("Atas das Sessões", null, false, 3, "link", { "url" : "/arquivos_publicos.html?id=" + atasDasSessoesFolder._id, "target" : "_parent" });
         } else {
            atasDasSessoesMenuItem = await migrateMenuPortalItem("Atas das Sessões", null, false, 3, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }
         //requerimentos verbais
         var requerimentosVerbaisFolder = migratePublicFiles.getFolder(REQUERIMENTOS_VERBAIS_PUBLIC_FOLDER);
         var requerimentosVerbaisMenuItem;
         if (requerimentosVerbaisFolder) {
            requerimentosVerbaisMenuItem = await migrateMenuPortalItem("Requerimentos Verbais", null, false, 4, "link", { "url" : "/arquivos_publicos.html?id=" + requerimentosVerbaisFolder._id, "target" : "_parent" });
         } else {
            requerimentosVerbaisMenuItem = await migrateMenuPortalItem("Requerimentos Verbais", null, false, 4, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }
         var tribunaSocialMenuItem = await migrateMenuPortalItem("Tribuna Social", null, false, 4, "link", { "url" : "/page.html?tag=tribunasocial", "target" : "_parent" });

         atividadesLegislativasMenuItem.menuItems.push(materiasLegislativasMenuItem);
         atividadesLegislativasMenuItem.menuItems.push(pesquisaAvancadaMateriasLegislativasMenuItem);
         atividadesLegislativasMenuItem.menuItems.push(pautasSessoesMenuItem);
         atividadesLegislativasMenuItem.menuItems.push(atasDasSessoesMenuItem);
         atividadesLegislativasMenuItem.menuItems.push(requerimentosVerbaisMenuItem);
         atividadesLegislativasMenuItem.menuItems.push(tribunaSocialMenuItem);
         await atividadesLegislativasMenuItem.save();
      //***************************Legislação********************
      var legislacaoMenuItem = await migrateMenuPortalItem("Legislação", null, true, 3, null, null);
         var pesquisaLegislacaoMenuItem = await migrateMenuPortalItem("Pesquisa de Legislação", null, false, 0, "link", { "url" : "/proposituras.html", "target" : "_parent" });
         var regimentoInternoMenuItem = await migrateMenuPortalItem("Regimento Interno", null, false, 1, "link", { "url" : "/propositura.html?numeroLei=1&tipoLei=6", "target" : "_parent" });
         var leiOrganicaMenuItem = await migrateMenuPortalItem("Lei Orgânica", null, false, 2, "link", { "url" : "/propositura.html?numeroLei=1&tipoLei=5", "target" : "_parent" });
         var estatutoServidoresMenuItem = await migrateMenuPortalItem("Estatuto Servidores", null, false, 3, "link", { "url" : "/propositura.html?numeroLei=3800&tipoLei=1", "target" : "_parent" });
         var processoLegislativoMenuItem = await migrateMenuPortalItem("Processo Legislativo", null, false, 4, "link", { "url" : "/page.html?tag=processo", "target" : "_parent" });
         var legislacaoDoEstadoMenuItem = await migrateMenuPortalItem("Legislação do Estado", null, false, 5, "link", { "url" : "http://www.legislacao.sp.gov.br/legislacao/index.htm", "target" : "_blank" });
         var constituicaoMenuItem = await migrateMenuPortalItem("Constituição", null, false, 6, "link", { "url" : "http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", "target" : "_blank" });
         var codigosMenuItem = await migrateMenuPortalItem("Códigos", null, false, 7, "link", { "url" : "http://www.planalto.gov.br/ccivil_03/Codigos/quadro_cod.htm", "target" : "_blank" });
         var legislativaFederalMenuItem = await migrateMenuPortalItem("Legislação Federal", null, false, 8, "link", { "url" : "https://www25.senado.leg.br/web/atividade/legislacao", "target" : "_blank" });

         legislacaoMenuItem.menuItems.push(pesquisaLegislacaoMenuItem);
         legislacaoMenuItem.menuItems.push(regimentoInternoMenuItem);
         legislacaoMenuItem.menuItems.push(leiOrganicaMenuItem);
         legislacaoMenuItem.menuItems.push(estatutoServidoresMenuItem);
         legislacaoMenuItem.menuItems.push(processoLegislativoMenuItem);
         legislacaoMenuItem.menuItems.push(legislacaoDoEstadoMenuItem);
         legislacaoMenuItem.menuItems.push(constituicaoMenuItem);
         legislacaoMenuItem.menuItems.push(codigosMenuItem);
         legislacaoMenuItem.menuItems.push(legislativaFederalMenuItem);
         await legislacaoMenuItem.save();
      //***************************Informação********************
      var informacaoMenuItem = await migrateMenuPortalItem("Informação", null, true, 4, null, null);
         var noticiasMenuItem = await migrateMenuPortalItem("Notícias", null, false, 0, "link", { "url" : "/news.html", "target" : "_parent" });
         var tvCamaraMenuItem = await migrateMenuPortalItem("TV Câmara", null, false, 1, "link", { "url" : "/tvlegislativa.html", "target" : "_parent" });
         var radioMenuItem = await migrateMenuPortalItem("Rádio", null, false, 2, "link", { "url" : "/radio.html", "target" : "_parent" });
         var licitacoesMenuItem = await migrateMenuPortalItem("Licitações", null, false, 3, "link", { "url" : "/licitacoes.html", "target" : "_parent" });
         var concursosMenuItem = await migrateMenuPortalItem("Concursos", null, false, 4, null, null);
         var agendaMenuItem = await migrateMenuPortalItem("Agenda", null, false, 5, "link", { "url" : "/calendar.html", "target" : "_parent" });
         var instagramMenuItem = await migrateMenuPortalItem("Instagram", null, false, 5, "link", { "url" : "https://www.instagram.com/camarasorocaba", "target" : "_blank" });
         var facebookMenuItem = await migrateMenuPortalItem("Facebook", null, false, 6, "link", { "url" : "https://www.facebook.com/camarasorocaba", "target" : "_blank" });
         var youtubeMenuItem = await migrateMenuPortalItem("Youtube", null, false, 7, "link", { "url" : "https://www.youtube.com/channel/UCWQR_GgpIhrfoG1vikt94bA", "target" : "_blank" });
         var flickrMenuItem = await migrateMenuPortalItem("Flickr", null, false, 8, "link", { "url" : "https://www.flickr.com/photos/camarasorocaba/", "target" : "_blank" });
         var memorialMenuItem = await migrateMenuPortalItem("Memorial", null, false, 9, "link", { "url" : "http://www.memorialsorocaba.com.br/", "target" : "_blank" });
         var escolaLegislativoMenuItem = await migrateMenuPortalItem("Escola do Legislativo", null, false, 10, "link", { "url" : "/page.html?tag=escolalegislativo", "target" : "_parent" });

         informacaoMenuItem.menuItems.push(noticiasMenuItem);
         informacaoMenuItem.menuItems.push(tvCamaraMenuItem);
         informacaoMenuItem.menuItems.push(radioMenuItem);
         informacaoMenuItem.menuItems.push(licitacoesMenuItem);
         informacaoMenuItem.menuItems.push(concursosMenuItem);
         informacaoMenuItem.menuItems.push(agendaMenuItem);
         informacaoMenuItem.menuItems.push(instagramMenuItem);
         informacaoMenuItem.menuItems.push(facebookMenuItem);
         informacaoMenuItem.menuItems.push(youtubeMenuItem);
         informacaoMenuItem.menuItems.push(flickrMenuItem);
         informacaoMenuItem.menuItems.push(memorialMenuItem);
         informacaoMenuItem.menuItems.push(escolaLegislativoMenuItem);
         await informacaoMenuItem.save();

         var concurso012013MenuItem = await migrateMenuPortalItem("Concurso 1/2013", null, false, 0, "link", { "url" : "/page.html?tag=concurso012013", "target" : "_parent" });
         concursosMenuItem.menuItems.push(concurso012013MenuItem);
         await concursosMenuItem.save();
      //****************************Finanças********************
      var financasMenuItem =  await migrateMenuPortalItem("Finanças", null, true, 5, null, null);
         var contasPublicasMenuItem = await migrateMenuPortalItem("Contas Públicas", null, false, 0, null, null);
         var portalTransparenciaMenuItem = await migrateMenuPortalItem("Portal da Transparência", null, false, 1, "link", { "url" : "http://sorocaba.camara.sp.etransparencia.com.br/", "target" : "_blank" });
         var vencimentoServidoresMenuItem = await migrateMenuPortalItem("Vencimento Servidores", null, false, 2, "link", { "url" : "http://leideacesso.etransparencia.com.br/sorocaba.camara.sp/Portal/dash.html?2,139,96", "target" : "_blank" });

         financasMenuItem.menuItems.push(contasPublicasMenuItem);
         financasMenuItem.menuItems.push(portalTransparenciaMenuItem);
         financasMenuItem.menuItems.push(vencimentoServidoresMenuItem);

         await financasMenuItem.save();

         //contas públicas items
         //LEI_RESPONSABILIDADE_FISCAL_FOLDER
         var leiDeResponsabilidadeFiscalFolder = migratePublicFiles.getFolder(LEI_RESPONSABILIDADE_FISCAL_FOLDER);
         var leiDeResponsabilidadeFiscalMenuItem;
         if (leiDeResponsabilidadeFiscalFolder) {
            leiDeResponsabilidadeFiscalMenuItem = await migrateMenuPortalItem("Lei de Reponsabilidade Fiscal", null, false, 0, "link", { "url" : "/arquivos_publicos.html?id=" + leiDeResponsabilidadeFiscalFolder._id, "target" : "_parent" });
         } else {
            leiDeResponsabilidadeFiscalMenuItem = await migrateMenuPortalItem("Lei de Reponsabilidade Fiscal", null, false, 0, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }
         //LEI_FEDERAL_9755_98_FOLDER
         var leiFederal975598Folder = migratePublicFiles.getFolder(LEI_FEDERAL_9755_98_FOLDER);
         var leiFederal975598MenuItem;
         if (leiFederal975598Folder) {
            leiFederal975598MenuItem = await migrateMenuPortalItem("Lei Federal 9755/98", null, false, 1, "link", { "url" : "/arquivos_publicos.html?id=" + leiFederal975598Folder._id, "target" : "_parent" });
         } else {
            leiFederal975598MenuItem = await migrateMenuPortalItem(" Lei Federal 9755/98", null, false, 1, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }
         //SALARIO_SERVIDORES_FOLDER
         var salarioServidoresFolder = migratePublicFiles.getFolder(SALARIO_SERVIDORES_FOLDER);
         var salarioServidoresMenuItem;
         if (salarioServidoresFolder) {
            salarioServidoresMenuItem = await migrateMenuPortalItem("Salários dos Servidores", null, false, 2, "link", { "url" : "/arquivos_publicos.html?id=" + salarioServidoresFolder._id, "target" : "_parent" });
         } else {
            salarioServidoresMenuItem = await migrateMenuPortalItem("Salários dos Servidores", null, false, 2, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }
         //PRESTACAO_CONTAS_ANUAL_FOLDER
         var prestacaoContasFolder = migratePublicFiles.getFolder(PRESTACAO_CONTAS_ANUAL_FOLDER);
         var prestacaoContasMenuItem;
         if (prestacaoContasFolder) {
            prestacaoContasMenuItem = await migrateMenuPortalItem("Prestação de Contas Anual", null, false, 3, "link", { "url" : "/arquivos_publicos.html?id=" + prestacaoContasFolder._id, "target" : "_parent" });
         } else {
            prestacaoContasMenuItem = await migrateMenuPortalItem("Prestação de Contas Anual", null, false, 3, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }
         //VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER
         var valorSubsidioRemuneracaoCargosEtcFolder = migratePublicFiles.getFolder(VALOR_SUBSIDIO_REMUNERACAO_CARGOS_ETC_FOLDER);
         var valorSubsidioRemuneracaoCargosEtcMenuItem;
         if (valorSubsidioRemuneracaoCargosEtcFolder) {
            valorSubsidioRemuneracaoCargosEtcMenuItem = await migrateMenuPortalItem("Valor de Subsídio e Remuneração de Cargos e Empregos Públicos", null, false, 4, "link", { "url" : "/arquivos_publicos.html?id=" + valorSubsidioRemuneracaoCargosEtcFolder._id, "target" : "_parent" });
         } else {
            valorSubsidioRemuneracaoCargosEtcMenuItem = await migrateMenuPortalItem("Valor de Subsídio e Remuneração de Cargos e Empregos Públicos", null, false, 4, "link", { "url" : "/arquivos_publicos.html", "target" : "_parent" });
         }

         contasPublicasMenuItem.menuItems.push(leiDeResponsabilidadeFiscalMenuItem);
         contasPublicasMenuItem.menuItems.push(leiFederal975598MenuItem);
         contasPublicasMenuItem.menuItems.push(salarioServidoresMenuItem);
         contasPublicasMenuItem.menuItems.push(prestacaoContasMenuItem);
         contasPublicasMenuItem.menuItems.push(valorSubsidioRemuneracaoCargosEtcMenuItem);

         await contasPublicasMenuItem.save();
      return Promise.resolve(true);
   } catch(error) {
      console.log("Error while migrating menu portal items, err = [" + error + "].");
   }
}
/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateMenuPortal");
   return _migrate()
            .catch(function(error) {
               console.log("Error while migrating menu portal items, err = [" + error + "].");
            });
}
