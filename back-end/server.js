import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { check, validationResult } from "express-validator";

const app = express();
app.use(
  cors({
    origin: [
      "http://192.168.0.10:5173/",
      "http://192.168.0.10:5173",
      "http://192.168.0.10:8081",
      "http://192.168.0.10:9000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // Allow credentials
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "signup",
});

const con1 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "epushserver",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

con.connect(function (err) {
  if (err) {
    console.log("Error in Connection");
  } else {
    console.log("Connected");
  }
});

let tokensss;

app.post("/create", upload.single("employeeImage"), (req, res) => {
  console.log(req.body, "req.body");
  // Check if the userName already exists in the database
  const checkUserNameSql =
    "SELECT COUNT(*) AS count FROM employee WHERE `userName` = ?";
  con.query(checkUserNameSql, [req.body.userName], (err, result) => {
    if (err) {
      return res.json({ Error: "Error in checking userName" });
    }
    if (result[0].count > 0) {
      // If the userName already exists, return an error message
      return res.json({ Error: "userName already exists" });
    } else {
      // If the userName doesn't exist, proceed with the insert operation
      const sql =
        "INSERT INTO employee (`employeeName`, `EMPID`, `employeeEmail`, `userName`, `password`, `role`, `discipline`, `designation`, `date`, `employeeImage`, `employeeStatus`, `relievingDate`, `permanentDate`) VALUES (?)";
      if (err) return res.json({ Error: "Error in hashing password" });

      // Check if req.file is defined and set the image filename accordingly
      const imageFilename = req.file
        ? req.file.filename
        : "default-image-filename.jpg";

      const values = [
        req.body.employeeName,
        req.body.EMPID,
        req.body.employeeEmail,
        req.body.userName,
        req.body.password,
        req.body.role.toString(),
        req.body.discipline,
        req.body.designation,
        req.body.date,
        imageFilename, // Use the image filename or a default value
        req.body.employeeStatus,
        req.body.relievingDate,
        req.body.permanentDate,
      ];

      con.query(sql, [values], (err, result) => {
        if (err) return res.json({ Error: "Error in signup query" });
        return res.json({ Status: "Success" });
      });
    }
  });
});

app.post("/applyLeave", (req, res) => {
  const baseSql =
    "INSERT INTO leavedetails (`leaveType`,`leaveFrom`,`leaveTo`, `leaveHours`,`reason`, `employeeName`, `employeeId`";
  let sql = baseSql;
  const values = [
    req.body.leaveType,
    req.body.leaveFrom,
    req.body.leaveTo,
    req.body.leaveHours,
    req.body.reason,
    req.body.employeeName,
    req.body.employeeId,
  ];

  // Optional fields that are not required
  if (req.body.leaveStatus !== undefined) {
    sql += ", `leaveStatus`";
    values.push(req.body.leaveStatus);
  }
  if (req.body.totalLeaves !== undefined) {
    sql += ", `totalLeaves`";
    values.push(req.body.totalLeaves);
  }
  sql += ") VALUES (?)";

  con.query(sql, [values], (err, result) => {
    if (err) {
      // Handle error
      return res.json({ Error: err });
    } else {
      // Handle success
      return res.json({ Status: "Success", Result: result });
    }
  });
});

app.post("/applycompOff", (req, res) => {
  const baseSql =
    "INSERT INTO compoff (`leaveType`,`leaveFrom`,`reason`, `employeeName`, `employeeId`, `workHours`";
  let sql = baseSql;
  const values = [
    req.body.leaveType,
    req.body.leaveFrom,
    req.body.reason,
    req.body.employeeName,
    req.body.employeeId,
    req.body.workHours,
  ];

  // Optional fields that are not required
  if (req.body.leaveStatus !== undefined) {
    sql += ", `leaveStatus`";
    values.push(req.body.leaveStatus);
  }
  sql += ") VALUES (?)";

  con.query(sql, [values], (err, result) => {
    if (err) {
      // Handle error
      return res.json({ Error: err });
    } else {
      // Handle success
      return res.json({ Status: "Success", Result: result });
    }
  });
});

app.put("/compOff/:id", (req, res) => {
  const leaveId = req.params.id;
  const {
    leaveType,
    leaveFrom,
    reason,
    employeeName,
    employeeId,
    leaveStatus,
    totalLeaves,
  } = req.body;

  const sql = `
    UPDATE leavedetails
    SET
      leaveType = ?,
      leaveFrom = ?,
      reason = ?,
      employeeName = ?,
      employeeId = ?,
      leaveStatus = ?,
      totalLeaves = ?
    WHERE id = ?
  `;

  const values = [
    leaveType,
    leaveFrom,
    reason,
    employeeName,
    employeeId,
    leaveStatus,
    totalLeaves,
    leaveId, // id parameter for the WHERE clause
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      // Handle error
      return res.json({ Error: err });
    } else {
      // Handle success
      return res.json({ Status: "Success", Result: result });
    }
  });
});

app.put("/updateLeave/:id", (req, res) => {
  const leaveId = req.params.id;
  const {
    leaveType,
    leaveFrom,
    leaveTo,
    leaveHours,
    reason,
    employeeName,
    employeeId,
    leaveStatus,
    totalLeaves,
  } = req.body;

  const sql = `
    UPDATE leavedetails
    SET
      leaveType = ?,
      leaveFrom = ?,
      leaveTo = ?,
      leaveHours = ?,
      reason = ?,
      employeeName = ?,
      employeeId = ?,
      leaveStatus = ?,
      totalLeaves = ?
    WHERE id = ?
  `;

  const values = [
    leaveType,
    leaveFrom,
    leaveTo,
    leaveHours,
    reason,
    employeeName,
    employeeId,
    leaveStatus,
    totalLeaves,
    leaveId, // id parameter for the WHERE clause
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      // Handle error
      return res.json({ Error: err });
    } else {
      // Handle success
      return res.json({ Status: "Success", Result: result });
    }
  });
});

app.put("/updateCompOff/:compOffId", (req, res) => {
  const compOffId = req.params.compOffId;
  const sql = `
    UPDATE compoff 
    SET 
      leaveType = ?,
      leaveFrom = ?,
      reason = ?,
      employeeName = ?,
      employeeId = ?,
      workHours = ?,
      eligibility = ?,
      leaveStatus = ?
    WHERE id = ?
  `;
  const values = [
    req.body.leaveType,
    req.body.leaveFrom,
    req.body.reason,
    req.body.employeeName,
    req.body.employeeId,
    req.body.workHours,
    req.body.eligibility,
    req.body.leaveStatus,
    compOffId, // Use the compOff ID to specify which record to update
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      // Handle error
      return res.json({ Error: err });
    } else {
      // Handle success
      return res.json({ Status: "Success", Result: result });
    }
  });
});

app.get("/getcompOffDetails", (req, res) => {
  const sql = "SELECT * FROM compOff";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get compOff error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/getLeaveDetails", (req, res) => {
  const sql = "SELECT * FROM leavedetails";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get leavedetails error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.delete("/deletecompOff/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM compOff WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete compOff error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.delete("/deleteLeave/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM leavedetails WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete leavedetails error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.get("/getEmployee", (req, res) => {
  const sql = "SELECT * FROM employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/get/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM employee where id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.put("/update/:id", upload.single("employeeImage"), (req, res) => {
  const employeeId = req.params.id;
  console.log(req.body, "req.body");

  // Check if the userName already exists in the database for a different employee
  const checkUserNameSql =
    "SELECT COUNT(*) AS count FROM employee WHERE `userName` = ? AND `id` <> ?";
  con.query(
    checkUserNameSql,
    [req.body.userName, employeeId],
    (err, result) => {
      if (err) {
        return res.json({ Error: "Error in checking userName" });
      }
      if (result[0].count > 0) {
        // If the userName already exists for another employee, return an error message
        return res.json({ Error: "userName already exists" });
      } else {
        // If the userName doesn't exist or exists for the same employee, proceed with the update operation
        let updateSql =
          "UPDATE employee SET `employeeName`=?, `EMPID`=?, `employeeEmail`=?, `userName`=?";
        const values = [
          req.body.employeeName,
          req.body.EMPID,
          req.body.employeeEmail,
          req.body.userName,
        ];

        // Add optional fields if they are provided in the request
        if (req.body.password) {
          if (err) return res.json({ Error: "Error in hashing password" });
          updateSql += ", `password`=?";
          values.push(req.body.password);
          continueUpdate();
        } else {
          continueUpdate();
        }

        function continueUpdate() {
          if (req.body.role) {
            updateSql += ", `role`=?";
            values.push(req.body.role.toString());
          }

          if (req.body.discipline) {
            updateSql += ", `discipline`=?";
            values.push(req.body.discipline);
          }

          if (req.body.designation) {
            updateSql += ", `designation`=?";
            values.push(req.body.designation);
          }

          if (req.body.date) {
            updateSql += ", `date`=?";
            values.push(req.body.date);
          }

          if (req.file || req.body.employeeImage) {
            updateSql += ", `employeeImage`=?";
            values.push(req.file ? req.file.filename : req.body.employeeImage);
          }

          if (req.body.employeeStatus) {
            updateSql += ", `employeeStatus`=?";
            values.push(req.body.employeeStatus);
          }
          if (req.body.relievingDate) {
            updateSql += ", `relievingDate`=?";
            values.push(req.body.relievingDate);
          }
          if (req.body.permanentDate) {
            updateSql += ", `permanentDate`=?";
            values.push(req.body.permanentDate);
          }
          updateSql += " WHERE `id`=?";
          values.push(employeeId);

          con.query(updateSql, values, (err, result) => {
            if (err) return res.json({ Error: "Error in update query" });
            return res.json({ Status: "Success" });
          });
        }
      }
    }
  );
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM employee WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete employee error in sql" });
    return res.json({ Status: "Success" });
  });
});

const verifyUser = (req, res, next) => {
  if (!req.body?.tokensss) {
    return res.json({ Error: "You are no Authenticated" });
  } else {
    jwt.verify(req.body?.tokensss, "jwt-secret-key", (err, decoded) => {
      if (err) return res.json({ Error: "Token wrong" });
      req.userName = decoded.userName;
      req.id = decoded.id;
      req.role = decoded.role;
      req.employeeName = decoded.employeeName;
      req.employeeId = decoded.employeeId;
      req.tlName = decoded.tlName;
      req.hrName = decoded.hrName;
      next();
    });
  }
};

app.post("/dashboard", verifyUser, (req, res) => {
  console.log(req.body, "req24523");
  return res.json({
    Status: "Success",
    role: req.role,
    id: req.id,
    employeeId: req.employeeId,
    userName: req.userName,
    employeeName: req?.employeeName,
    tlName: req?.tlName,
    hrName: req?.hrName,
  });
});

app.get("/adminCount", (req, res) => {
  const sql = "Select count(id) as admin from users";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

app.get("/employeeCount", (req, res) => {
  const sql = "Select count(id) as employee from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

app.post("/login", (req, res) => {
  const sql = "SELECT * FROM users Where userName = ? AND  password = ?";
  con.query(sql, [req.body.userName, req.body.password], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      const id = result[0].id;
      const token = jwt.sign(
        { role: "admin", userName: result[0].userName },
        "jwt-secret-key",
        {
          expiresIn: "1d",
        }
      );
      res.cookie("token", token);
      return res.json({ Status: "Success", token: token });
    } else {
      return res.json({ Status: "Error", Error: "Wrong userName or Password" });
    }
  });
});

app.post(
  "/employeelogin",
  [
    check("userName").notEmpty().withMessage("Username is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userName, password } = req.body;

    // Query the database to fetch user data by userName
    const sql = "SELECT * FROM employee WHERE userName = ?";

    con.query(sql, [userName], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Check if the user exists in the database
      if (results.length === 0) {
        return res.status(401).json({ error: "Wrong Email or Password" });
      }

      const user = results[0];
      console.log(results, "results2321", password, user.password);
      // Compare the provided password with the hashed password in the database

      if (String(password) === String(user.password)) {
        // Generate a JWT token
        const token = jwt.sign(
          {
            role: user.role,
            id: user.id,
            userName: user.userName,
            employeeName: user.employeeName,
            employeeId: user.EMPID,
          },
          "jwt-secret-key",
          { expiresIn: "1d" }
        );
        tokensss = token;
        // Send the token as a response to the client
        return res.status(200).json({ tokensss });
      } else {
        return res.status(401).json({ error: "Authentication failed" });
      }
    });
  }
);

//teamLead Oprationss

app.post("/lead/create", upload.single("image"), (req, res) => {
  // const checkUserNameSql = "SELECT COUNT(*) AS count FROM team_lead WHERE  `leadName` = ?";
  // con.query(checkUserNameSql, [req.body.leadName], (err, result) => {
  //   if (err) {
  //     return res.json({ Error: "Error in checking leadName" });
  //   }
  //   if (result[0]?.count > 0) {
  //     return res.json({ Error: "leadName already exists" });
  //   } else {
  const sql =
    "INSERT INTO team_lead (`leadName`,`teamName`, `EMPID`) VALUES (?)";
  // if (err) return res.json({ Error: "Error in hashing password" });
  const values = [req.body.leadName, req.body.teamName, req.body.EMPID];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Inside singup query" });
    return res.json({ Status: "Success" });
  });
  //   }
  // });
});

app.get("/getLead", (req, res) => {
  const sql = "SELECT * FROM team_lead";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.delete("/lead/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM team_lead WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete employee error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.post("/teamLeadlogin", (req, res) => {
  const sql = "SELECT * FROM team_lead Where userName = ?";
  con.query(sql, [req.body.userName], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      console.log(result, "resultresult");
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign(
              {
                role: "teamLead",
                id: result[0].id,
                userName: result[0].userName,
                tlName: result[0].leadName,
              },
              "jwt-secret-key",
              { expiresIn: "1d" }
            );
            res.cookie("token", token);
            return res.json({ Status: "Success", id: result[0].id });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong userName or Password",
            });
          }
        }
      );
    } else {
      return res.json({ Status: "Error", Error: "Wrong userName or Password" });
    }
  });
});

//Hr Api
app.post("/hr/create", (req, res) => {
  const checkUserNameSql =
    "SELECT COUNT(*) AS count FORM hr WHERE `userName` = ?";
  con.query(checkUserNameSql, [req.body.userName], (err, result) => {
    if (err) {
      return res.json({ Error: "Error in checking userName" });
    }
    if (result[0].count > 0) {
      return res.json.apply({ Error: "userName aleady exists" });
    } else {
      const sql = "INSERT INTO hr (`hrName`,`userName`,`password`) VALUES (?)";
      bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if (err) return res.json({ Error: "Error in hashing password" });
        const values = [req.body.hrName, req.body.userName, hash];
        con.query(sql, [values], (err, result) => {
          if (err) return res.json({ Error: "Inside singup query" });
          return res.json({ Status: "Success" });
        });
      });
    }
  });
});

app.get("/getHr", (req, res) => {
  const sql = "SELECT * FROM hr";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.delete("/hr/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM hr WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete hr error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.post("/hrLogin", (req, res) => {
  const sql = "SELECT * FROM hr Where userName = ?";
  con.query(sql, [req.body.userName], (err, result) => {
    console.log(result, "resultresult");
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      console.log(result, "resultresult");
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign(
              {
                role: "hr",
                id: result[0].id,
                userName: result[0].userName,
                hrName: result[0].hrName,
              },
              "jwt-secret-key",
              { expiresIn: "1d" }
            );
            res.cookie("token", token);
            return res.json({ Status: "Success", id: result[0].id });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong userName or Password",
            });
          }
        }
      );
    } else {
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});

//Projects Apis
app.post("/project/create", (req, res) => {
  const sql =
    "INSERT INTO project (`tlName`,`orderId`,`positionNumber`, `subPositionNumber`,`projectNo`,`taskJobNo`, `referenceNo`,`desciplineCode`, `projectName`,`subDivision`,`startDate`,`targetDate`,`allotatedHours`, `tlID`) VALUES (?)";
  const values = [
    req.body.tlName,
    req.body.orderId,
    req.body.positionNumber,
    req.body.subPositionNumber,
    req.body.projectNo,
    req.body.taskJobNo,
    req.body.referenceNo,
    req.body.desciplineCode,
    req.body.projectName,
    req.body.subDivision,
    req.body.startDate,
    req.body.targetDate,
    req.body.allotatedHours,
    req.body.tlID,
  ];
  con.query(sql, [values], (err, result) => {
    console.log(err, "error");
    if (err) return res.json({ Error: "Inside add Project query" });
    return res.json({ Status: "Success" });
  });
});

app.put("/project/update/:projectId", (req, res) => {
  const projectId = req.params.projectId;
  const sql = `
    UPDATE project 
    SET 
      tlName = ?,
      orderId = ?,
      positionNumber = ?,
      subPositionNumber = ?,
      projectNo = ?,
      taskJobNo = ?,
      referenceNo = ?,
      desciplineCode = ?,
      projectName = ?,
      subDivision = ?,
      startDate = ?,
      targetDate = ?,
      allotatedHours = ?,
      tlID = ?
    WHERE id = ?
  `;
  const values = [
    req.body.tlName,
    req.body.orderId,
    req.body.positionNumber,
    req.body.subPositionNumber,
    req.body.projectNo,
    req.body.taskJobNo,
    req.body.referenceNo,
    req.body.desciplineCode,
    req.body.projectName,
    req.body.subDivision,
    req.body.startDate,
    req.body.targetDate,
    req.body.allotatedHours, // Corrected the field name here
    req.body.tlID, // Corrected the field name here
    projectId, // Use the project ID to specify which project to update
  ];
  con.query(sql, values, (err, result) => {
    if (err) {
      console.log(err, "error");
      return res.json({ Error: "Inside update Project query" });
    }
    return res.json({ Status: "Success" });
  });
});

app.post("/project/addWorkDetails", (req, res) => {
  const baseSql =
    "INSERT INTO workdetails (`employeeName`,`userName`,`referenceNo`,`projectName`,`tlName`, `taskNo`,`areaofWork`,`variation`, `subDivision`, `totalHours`, `weekNumber`,`projectNo`,`employeeNo`,`designation`";
  let sql = baseSql;
  const values = [
    req.body.employeeName,
    req.body.userName,
    req.body.referenceNo,
    req.body.projectName,
    req.body.tlName,
    req.body.taskNo,
    req.body.areaofWork,
    req.body.variation,
    req.body.subDivision,
    req.body.totalHours,
    req.body.weekNumber,
    req.body.projectNo,
    req.body.employeeNo,
    req.body.designation,
  ];

  // Optional fields that are not required
  const optionalFields = [
    "discipline",
    "subDivisionList",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "status",
    "sentDate",
    "approvedDate",
    "allotatedHours",
    "desciplineCode",
  ];
  optionalFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      sql += `, \`${field}\``;
      values.push(req.body[field]);
    }
  });
  sql += ") VALUES (?)";

  con.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting work details:", err);
      return res.json({ Status: "Error", Error: err });
    } else {
      console.log("Work details inserted successfully");
      return res.json({ Status: "Success", Result: result });
    }
  });
});

app.put("/project/updateWorkDetails/:id", (req, res) => {
  const workDetailId = req.params.id;
  const baseSql =
    "UPDATE workdetails SET `employeeName`=?, `userName`=?, `referenceNo`=?, `projectName`=?, `tlName`=?, `taskNo`=?, `areaofWork`=?, `variation`=?, `subDivision`=?, `totalHours`=?, `weekNumber`=?, `projectNo`=?, `employeeNo`=?, `designation`=?";
  let sql = baseSql;
  const values = [
    req.body.employeeName,
    req.body.userName,
    req.body.referenceNo,
    req.body.projectName,
    req.body.tlName,
    req.body.taskNo,
    req.body.areaofWork,
    req.body.variation,
    req.body.subDivision,
    req.body.totalHours,
    req.body.weekNumber,
    req.body.projectNo,
    req.body.employeeNo,
    req.body.designation,
  ];

  // Optional fields that are not required
  const optionalFields = [
    "discipline",
    "subDivisionList",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "status",
    "sentDate",
    "approvedDate",
    "allotatedHours",
    "desciplineCode",
  ];
  optionalFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      sql += `, \`${field}\`=?`;
      values.push(req.body[field]);
    }
  });
  sql += " WHERE id = ?";

  values.push(workDetailId);

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating work details:", err);
      return res.json({ Status: "Error", Error: err });
    } else {
      console.log("Work details updated successfully");
      return res.json({ Status: "Success", Result: result });
    }
  });
});

app.get("/getBioDetails", (req, res) => {
  const sql = "SELECT * FROM devicelogsinfo";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get Bio Details error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.post("/filterTimeSheet", (req, res) => {
  console.log(req.body, "reqbodadasdy");

  if (
    !req.body.userId ||
    !req.body.logDates ||
    !Array.isArray(req.body.logDates)
  ) {
    return res
      .status(400)
      .json({ error: "userId and an array of logDates are required." });
  }

  // Create a comma-separated string of dates for the SQL query
  const dateList = req.body.logDates.map((date) => `'${date}'`).join(",");

  const sql = `SELECT *, DATE_FORMAT(LogDate, '%Y-%m-%d %H:%i:%s') AS FormattedLogDate FROM devicelogsinfo  WHERE DATE(LogDate) IN (${dateList})  AND UserId = ?`;

  // Execute the SQL query with parameters
  con1.query(sql, [req.body.userId], (err, results) => {
    if (err) {
      console.error("Error executing SQL query:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    return res.json(results);
  });
});

app.get("/getProject", (req, res) => {
  const sql = "SELECT * FROM project";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/getProject/:id", (req, res) => {
  const projectId = req.params.id;
  const sql = "SELECT * FROM project WHERE id = ?";
  con.query(sql, [projectId], (err, result) => {
    if (err) {
      return res.json({ Error: "Get project by ID error in SQL" });
    }

    if (result.length === 0) {
      return res.json({ Error: "Project not found" });
    }

    return res.json({ Status: "Success", Result: result[0] });
  });
});

app.put("/project/update/completion/:projectId", (req, res) => {
  const projectId = req.params.projectId; // Extract the project ID from the URL
  const newCompletion = req.body.completion; // Get the new completion value from the request body

  const sql = "UPDATE project SET completion = ? WHERE id = ?";
  const values = [newCompletion, projectId];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.log(err, "error");
      return res.json({ Error: "Inside update Project query" });
    }

    if (result.affectedRows === 0) {
      return res.json({ Error: "Project not found or no update required" });
    }

    return res.json({ Status: "Success" });
  });
});

app.get("/getWrokDetails", (req, res) => {
  const sql = "SELECT * FROM workdetails";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get workdetails error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/settings", (req, res) => {
  const sql = "SELECT * FROM settings";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get settings error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/discipline", (req, res) => {
  const sql = "SELECT * FROM discipline";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get discipline error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/areaofwork", (req, res) => {
  const sql = "SELECT * FROM areaofwork";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get areaofwork error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/variation", (req, res) => {
  const sql = "SELECT * FROM variation";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get variation error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/designation", (req, res) => {
  const sql = "SELECT * FROM designation";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get designation error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.delete("/project/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM project WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete employee error in sql" });
    return res.json({ Status: "Success" });
  });
});

// app.post("/create/updates", upload.single("Announcements"), (req, res) => {
//   console.log("req.body", req.file);
//   const sql =
//     "INSERT INTO settings (`updateTitle`, `UpdateDisc`, `Announcements`) VALUES (?)";
//   const values = [req.body.updateTitle, req.body.UpdateDisc, req.file.filename];
//   con.query(sql, [values], (err, result) => {
//     if (err) return res.json({ Error: "Error in signup query" });
//     return res.json({ Status: "Success" });
//   });
// });

app.post("/create/updates", (req, res) => {
  console.log("req.body", req.body);
  const sql =
    "INSERT INTO settings (`updateTitle`, `UpdateDisc`, `Announcements`, `Circular`, `Gallery`, `ViewExcel`) VALUES (?)";
  const values = [
    req.body.updateTitle,
    req.body.UpdateDisc,
    req.body.Announcements,
    req.body.Circular,
    req.body.Gallery,
    req.body.ViewExcel,
  ];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Error in signup query" });
    return res.json({ Status: "Success" });
  });
});

app.post("/create/designation", (req, res) => {
  console.log(req.body, "req.body");
  const sql = "INSERT INTO designation (`designation`) VALUES (?)";
  const values = [req.body.designation];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Error in signup query" });
    return res.json({ Status: "Success" });
  });
});

app.post("/create/discipline", (req, res) => {
  console.log(req.body, "req.body");
  const sql = "INSERT INTO discipline (`discipline`) VALUES (?)";
  const values = [req.body.discipline];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Error in signup query" });
    return res.json({ Status: "Success" });
  });
});

app.post("/create/areaofwork", (req, res) => {
  console.log(req.body, "req.body");
  const sql = "INSERT INTO areaofwork (`areaofwork`) VALUES (?)";
  const values = [req.body.areaofwork];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Error in signup query" });
    return res.json({ Status: "Success" });
  });
});

app.post("/create/variation", (req, res) => {
  console.log(req.body, "req.body");
  const sql = "INSERT INTO variation (`variation`) VALUES (?)";
  const values = [req.body.variation];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Error in signup query" });
    return res.json({ Status: "Success" });
  });
});

app.delete("/updates/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM settings WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete settings error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.delete("/areaofwork/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM areaofwork WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete areaofwork error in sql" });
    return res.json({ Status: "Success" });
  });
});
app.delete("/designation/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM designation WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete designation error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.delete("/discipline/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM discipline WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete discipline error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.delete("/variation/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "Delete FROM variation WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete variation error in sql" });
    return res.json({ Status: "Success" });
  });
});

//Notification

app.post("/sendNotification", (req, res) => {
  const sql =
    "INSERT INTO notification (`from`,`to`,`message`, `sendDate`, `empId`, `tlId`) VALUES (?)";
  const values = [
    req.body.from,
    req.body.to,
    req.body.message,
    req.body.sendDate,
    req.body.empId,
    req.body.tlId,
  ];
  console.log(values, "values234");
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Inside singup query" });
    return res.json({ Status: "Success" });
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});

app.listen(8081, () => {
  console.log("Running");
});
