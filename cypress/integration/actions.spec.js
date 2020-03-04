/// <reference types="cypress" />
const { Parser } = require("json2csv");
const data = require("../../data.json");
const csvToJSON = require("csvtojson");

const delay = ms => new Promise(res => setTimeout(() => res(), ms));
const getWandAndBoard = async (address, suburb) => {
  let results;
  let _res;
  const promise = new Promise(res => {
    _res = res;
  });
  cy.visit(
    "https://www.aucklandcouncil.govt.nz/about-auckland-council/how-auckland-council-works/governing-body-wards-committees/wards/Pages/find-your-ward.aspx"
  ).then(() => {
    return cy
      .get(
        "#ctl00_SPWebPartManager1_g_edfffc2b_c31b_465c_90ea_b46875a5d96e_ctl00_ctl00_ACAutoComplete"
      )
      .type(`${address} ${suburb}`)
      .then(() => {
        return delay(500);
      });
  });
  cy.get(".dropdown-item")
    .first()
    .click()
    .then(async () => {
      let board = "";
      let ward = "";
      while (!board && !ward) {
        board = Cypress.$("#FindYourResponse h4 b")
          .eq(1)
          .text()
          .trim();
        ward = Cypress.$("#FindYourResponse h4 b")
          .eq(2)
          .text()
          .trim();
        await delay(100);
      }

      results = {
        address,
        suburb,
        ward,
        board
      };

      _res();
    });
  await promise;
  return results;
};
context("Actions", () => {
  // https://on.cypress.io/interacting-with-elements
  let initailData = [];
  beforeEach(async () => {
    let _res;
    const promise = new Promise(res => (_res = res));
    await cy.readFile("output.csv").then(async csvString => {
      initailData = await csvToJSON().fromString(csvString);
      _res();
    });
    await promise;
  });

  it(".type() - type into a DOM element", async () => {
    for (let i = 0; i < data.length; i++) {
      if (i % 20 === 0) {
        cy.log(`entry number ${i}`);
      }
      const address = data[i]["Street Address"];
      const suburb = data[i]["Suburb"];
      let existingEntry = initailData.find(({ address: add, suburb: sub }) => {
        return add === address && suburb === sub;
      });
      let result;
      if (!existingEntry) {
        result = await getWandAndBoard(address, suburb);
      } else {
        result = existingEntry;
      }
      const csv = `"${result.address}","${result.suburb}","${result.board}","${result.ward}"\n`;
      if (i >= initailData.length) {
        initailData.push(result);
        cy.writeFile("output.csv", csv, { flag: "a+" });
        if (initailData.length === data.length) {
          break;
        }
        if (!existingEntry) {
          throw new Error("continue");
        }
      }
    }
  });
});
