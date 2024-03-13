const express = require("express");
const sql = require('mssql');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json())
const url = require('url');

const PORT = process.env.PORT || 3000;

var config = {
    server: "newdb.c1ey44ucyzys.ap-southeast-2.rds.amazonaws.com", 
    user: "dbadmin",
    password: "dbadmin123",
    database: "testdb",
                port: 1433,
                options: {
                    "encrypt": false,
                    trustedConnection: true
                }
            };

var connection = sql.connect(config, function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');

});

// Define route for fetching data from SQL Server
app.get("/api/courses", (request, response) => {   
    new sql.Request().query("SELECT * FROM Courses", (err, result) => {
        if (result.recordset.length == 0) {
            console.error("No courses available", err);
        } else {
            response.send(result.recordset); // Send query result as response
            //console.dir(result.recordset);
        }
    });
});

app.post("/api/login", (request, response) => {   
    const { username, password } = request.body;
    new sql.Request().query("SELECT * FROM users where username = '" + username + "' and password = '" + password + "'", (err, result) => {
        if (result.recordset.length == 0 ) {            
            response.status(401).json({
                status: "failed",                
                message: "Invalid credentials, please try again.",
            });
        } else {
            response.status(200).json({
                status: "success",
                data: [result.recordset],
                message: "You have successfully logged in.",
            });           
           
        }
    });
});
app.post("/api/enrollCourse", (request, response) => {   
    const { userid, courseid, action } = request.body;

    let qry = "";
    if(action == 'enroll')
    {
        qry =  "insert into Enrollment(userid, courseid, progress) values (" + userid + ", " + courseid + ", 'Enrolled')";
    }
    else{
        qry = "delete from Enrollment where userid = '" + userid + "' and courseid = '" + courseid + "'";
    }
    
    new sql.Request().query(qry, (err, result) => {
          if (err) {
            console.error("Error in enrollment process:", err);
        } else {
            response.status(200).json({
                status: "success",
                data: [result.recordset],
                message: "You have successfully " + action + "ed the selected course.",
            });
           
           
        }
    });
});

app.get("/api/userprofile", (request, response) => {    
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    
    new sql.Request().query("select e.progress, c.coursename as title, c.courseid from Enrollment e left join Courses c on e.courseid = c.courseid where e.userid="+ request.query.id, (err, result) => {
        if (err) {
            console.error("Error in fetching user profile data:", err);
        } else {
            response.send(result.recordset); 
           // console.dir(result.recordset);
        }
    });
});

app.get("/api/searchcourse", (request, response) => {    
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;    
   
        new sql.Request().query("select c.*, Isnull(e.progress, '') as progress from Courses c left join Enrollment e on e.courseid = c.courseid and e.userid = "+ request.query.id + " where c.coursename like '%" + request.query.name +"%' or category like '%" + request.query.name +"%' or instructor like '%" + request.query.name +"%'", (err, result) => {
        if (err) {
            console.error("Error in searching course data:", err);
        } else {
            response.send(result.recordset); 
            //console.dir(result.recordset);
        }
    });
});

// Start the server on port 
app.listen(PORT, () => {
    console.log("Nodejs Server Started...");
});
