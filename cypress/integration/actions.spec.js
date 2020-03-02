/// <reference types="cypress" />
const { Parser } = require("json2csv");
const data = require("../../data.json");

const delay = ms =>
  new Promise(res => setTimeout(() => console.log("res run") || res(), ms));
const getWandAndBoard = async (address, suburb) => {
  let results;
  let _res;
  const promise = new Promise(res => {
    _res = res;
  });
  cy.visit(
    "https://www.aucklandcouncil.govt.nz/about-auckland-council/how-auckland-council-works/governing-body-wards-committees/wards/Pages/find-your-ward.aspx"
  );
  cy.get(
    "#ctl00_SPWebPartManager1_g_edfffc2b_c31b_465c_90ea_b46875a5d96e_ctl00_ctl00_ACAutoComplete"
  ).type(`${address} ${suburb}`);
  cy.get(".dropdown-item")
    .first()
    .click()
    .then(() => {
      const board = Cypress.$("#FindYourResponse h4 b")
        .eq(1)
        .text()
        .trim();
      const ward = Cypress.$("#FindYourResponse h4 b")
        .eq(2)
        .text()
        .trim();

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
  let results;
  beforeEach(() => {
    results = [];
  });
  after(async () => {
    const fields = ["address", "suburb", "board", "ward"];
    const opts = { fields };
    const parser = new Parser(opts);
    console.log(results);
    const csv = parser.parse(results);
    console.log(csv);
    cy.writeFile("output.csv", csv, "utf8");
  });

  // https://on.cypress.io/interacting-with-elements

  it(".type() - type into a DOM element", async () => {
    for (let i = 0; i < 3; i++) {
      const r = await getWandAndBoard(
        data[i]["Street Address"],
        data[i]["Suburb"]
      );
      console.log("r is", r);
      results.push(r);
    }
  });
});
