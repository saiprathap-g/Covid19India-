const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running successfully");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (value) => {
  return {
    districtId: value.district_id,
    districtName: value.district_name,
    stateId: value.state_id,
    cases: value.cases,
    cured: value.cured,
    active: value.active,
    deaths: value.deaths,
  };
};

const convertTotalValuesToResponseObject = (value) => {
  return {
    totalCases: value.cases,
    totalCured: value.cured,
    totalActive: value.active,
    totalDeaths: value.deaths,
  };
};

//Get All States
app.get("/states/", async (request, response) => {
  const getStatesQuery = `

        SELECT * FROM state; 
    `;
  const dbResponse = await db.all(getStatesQuery);
  response.send(
    dbResponse.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

//GET WITH ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    
     SELECT * FROM state WHERE state_id = ${stateId};
    
    
    `;

  const dbResponse = await db.get(getStateQuery);
  response.send(convertStateDbObjectToResponseObject(dbResponse));
});

//Post district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `INSERT INTO
      district (district_name,state_id,cases,cured,active,deaths)
    VALUES
      (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
      );`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    
     SELECT * FROM district WHERE district_id = ${districtId};
    
    
    `;

  const dbResponse = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(dbResponse));
});

//DELETE
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `

      DELETE FROM district WHERE district_id = ${districtId};

    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//district details updated

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    
        UPDATE
         district
          SET
           district_name = '${districtName}',
           state_id = ${stateId},
           cases = ${cases},
           cured = ${cured},
           active = ${active},
           deaths = ${deaths}
           WHERE district_id = ${districtId};
    
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `
    
       SELECT SUM(cases) as cases,
       SUM(cured) as cured,
       SUM(active) as active,
       SUM(deaths) as deaths
       FROM district WHERE state_id = ${stateId};
    
    `;

  const stateReportResponse = await db.get(getStateReport);
  response.send(convertTotalValuesToResponseObject(stateReportResponse));
});

//GET
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateDetails = `
    
     SELECT state_name FROM state JOIN district
      ON state.state_id = district.state_id WHERE district.district_id = ${districtId};
    
    
    `;

  const dbResponse = await db.get(getStateDetails);
  response.send({ stateName: dbResponse.state_name });
});

module.exports = app;
