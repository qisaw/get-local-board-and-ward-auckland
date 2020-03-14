const { Builder, By, Key, until } = require("selenium-webdriver");
const csvToJSON = require("csvtojson");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");
const fs = require("fs");
const data = require("../data.json");

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

const delay = ms => new Promise(res => setTimeout(res, ms));
const getWandAndBoard = async (driver, address, suburb) => {
  await driver.get(
    "https://www.aucklandcouncil.govt.nz/about-auckland-council/how-auckland-council-works/governing-body-wards-committees/wards/Pages/find-your-ward.aspx"
  );
  driver.wait(
    until.elementLocated(
      By.id(
        "ctl00_SPWebPartManager1_g_edfffc2b_c31b_465c_90ea_b46875a5d96e_ctl00_ctl00_ACAutoComplete"
      )
    )
  );
  const wb = driver.findElement(
    By.id(
      "ctl00_SPWebPartManager1_g_edfffc2b_c31b_465c_90ea_b46875a5d96e_ctl00_ctl00_ACAutoComplete"
    )
  );
  const fullAddress = `${address} ${suburb}`.replace(/'/g, "\\'");
  driver.executeScript(`arguments[0].value='${fullAddress}';`, wb);
  await driver
    .findElement(
      By.id(
        "ctl00_SPWebPartManager1_g_edfffc2b_c31b_465c_90ea_b46875a5d96e_ctl00_ctl00_ACAutoComplete"
      )
    )
    .sendKeys(Key.ENTER);
  await delay(200);
  await driver.wait(until.elementLocated(By.className("dropdown-item")));
  await delay(200);
  await driver.findElement(By.className("dropdown-item")).click();
  await driver.wait(until.elementLocated(By.css("#FindYourResponse h4 b")));
  const messages = await driver.findElements(By.css("#FindYourResponse h4 b"));
  const [, boardElement, wardElement] = messages;
  if (!boardElement || !wardElement) {
    return {
      address,
      suburb,
      board: "unknown",
      ward: "unknown"
    };
  }
  const [board, ward] = await Promise.all([
    boardElement.getText(),
    wardElement.getText()
  ]);
  return {
    address,
    suburb,
    board,
    ward
  };
};
(async function example() {
  const screen = {
    width: 1680,
    height: 1050
  };
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
    .build();
  const initialDataAsString = fs.readFileSync("./output.csv", "utf8");
  const initailData = await csvToJSON().fromString(initialDataAsString);
  try {
    for (let i = 0; i < data.length; i++) {
      const address = data[i]["Street Address"];
      const suburb = data[i]["Suburb"];
      console.log(`entry number ${i}`);
      let existingEntry = initailData.find(({ address: add, suburb: sub }) => {
        return add === address && suburb === sub;
      });
      let result;
      if (!existingEntry) {
        console.log(`address ${address}, suburb ${suburb}`);
        result = await getWandAndBoard(driver, address, suburb);
      } else {
        result = existingEntry;
      }
      const csv = `"${result.address}","${result.suburb}","${result.board}","${result.ward}"\n`;
      if (i >= initailData.length) {
        initailData.push(result);
        fs.appendFileSync("./output.csv", csv);
      }
    }
  } finally {
    await driver.quit();
  }
})();

process.on("unhandledRejection", async (reason, promise) => {
  console.log("Unhandled rejection at ", promise, `reason: ${reason.message}`);
  console.log("waiting 10 seconds and then exiting");
  await delay(10000);
  process.exit(1);
});
