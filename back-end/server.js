import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

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
        "INSERT INTO employee (`employeeName`, `EMPID`, `employeeEmail`, `userName`, `password`, `role`,`discipline`, `designation`, `date`, `employeeImage`, `employeeStatus`) VALUES (?)";
      bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if (err) return res.json({ Error: "Error in hashing password" });
        const values = [
          req.body.employeeName,
          req.body.EMPID,
          req.body.employeeEmail,
          req.body.userName,
          hash,
          req.body.role.toString(),
          req.body.discipline,
          req.body.designation,
          req.body.date,
          req.file.filename,
          req.body.employeeStatus,
        ];
        con.query(sql, [values], (err, result) => {
          if (err) return res.json({ Error: "Error in signup query" });
          return res.json({ Status: "Success" });
        });
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

app.get("/getLeaveDetails", (req, res) => {
  const sql = "SELECT * FROM leavedetails";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get leavedetails error in sql" });
    return res.json({ Status: "Success", Result: result });
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

app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE employee set userNname = ? WHERE id = ?";
  con.query(sql, [req.body.userNname, id], (err, result) => {
    if (err) return res.json({ Error: "update employee error in sql" });
    return res.json({ Status: "Success" });
  });
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
  if (!tokensss) {
    return res.json({ Error: "You are no Authenticated" });
  } else {
    jwt.verify(tokensss, "jwt-secret-key", (err, decoded) => {
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

app.get("/dashboard", verifyUser, (req, res) => {
  console.log(req, "reqreq342");
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
      return res.json({ Status: "Success" });
    } else {
      return res.json({ Status: "Error", Error: "Wrong userName or Password" });
    }
  });
});

app.post("/employeelogin", (req, res) => {
  console.log(req.body, "req121212");
  if (!req.body.userName || !req.body.password) {
    return res.status(400).json({ error: "Missing userName or password" });
  }

  const sql = "SELECT * FROM employee WHERE userName = ?";
  con.query(sql, [req.body.userName], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ error: "Wrong Email or Password" });
    }

    bcrypt.compare(
      req.body.password.toString(),
      result[0].password,
      (err, response) => {
        if (err) {
          console.error("Bcrypt error:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        if (response) {
          const token = jwt.sign(
            {
              role: result[0].role,
              id: result[0].id,
              userName: result[0].userName,
              employeeName: result[0].employeeName,
              employeeId: result[0].EMPID,
            },
            "jwt-secret-key",
            { expiresIn: "1d" }
          );
          tokensss = token;
          // Send the token as a response to the client
          return res.status(200).json({ token });
        } else {
          return res.status(401).json({ error: "Authentication failed" });
        }
      }
    );
  });
});

//teamLead Oprationss

app.post("/lead/create", upload.single("image"), (req, res) => {
  const checkUserNameSql =
    "SELECT COUNT(*) AS count FROM team_lead WHERE  `leadName` = ?";
  con.query(checkUserNameSql, [req.body.leadName], (err, result) => {
    if (err) {
      return res.json({ Error: "Error in checking leadName" });
    }
    if (result[0]?.count > 0) {
      return res.json({ Error: "leadName already exists" });
    } else {
      const sql = "INSERT INTO team_lead (`leadName`,`teamName`) VALUES (?)";
      if (err) return res.json({ Error: "Error in hashing password" });
      const values = [req.body.leadName, req.body.teamName];
      con.query(sql, [values], (err, result) => {
        if (err) return res.json({ Error: "Inside singup query" });
        return res.json({ Status: "Success" });
      });
    }
  });
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
    "INSERT INTO project (`tlName`,`orderId`,`positionNumber`, `subPositionNumber`,`projectNo`,`taskJobNo`, `referenceNo`,`desciplineCode`, `projectName`,`subDivision`,`startDate`,`targetDate`,`allotatedHours`) VALUES (?)";
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
  ];
  con.query(sql, [values], (err, result) => {
    console.log(err, "error");
    if (err) return res.json({ Error: "Inside add Project query" });
    return res.json({ Status: "Success" });
  });
});

app.post("/project/addWorkDetails", (req, res) => {
  const baseSql =
    "INSERT INTO workdetails (`employeeName`,`userName`,`referenceNo`,`projectName`,`tlName`, `taskNo`,`areaofWork`,`variation`, `subDivision`, `totalHours`, `weekNumber`";
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
    "UPDATE workdetails SET `employeeName`=?, `userName`=?, `referenceNo`=?, `projectName`=?, `tlName`=?, `taskNo`=?, `areaofWork`=?, `variation`=?, `subDivision`=?, `totalHours`=?, `weekNumber`=?";
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

// app.put("/project/updateWorkDetails/:id", (req, res) => {
//   const id = req.params.id;
//   const {
//     employeeName,
//     referenceNo,
//     projectName,
//     tlName,
//     taskNo,
//     areaofWork,
//     totalHours,
//     ...optionalFields
//   } = req.body;

//   const updateFields = [];
//   const values = [];

//   // Collect values and update fields for optional columns
//   Object.keys(optionalFields).forEach((field) => {
//     if (optionalFields[field] !== undefined) {
//       updateFields.push(`\`${field}\` = ?`);
//       values.push(optionalFields[field]);
//     }
//   });

//   // Optional fields that are not required
//   const mandatoryFields = [
//     "employeeName",
//     "referenceNo",
//     "projectName",
//     "tlName",
//     "taskNo",
//     "areaofWork",
//     "totalHours",
//   ];
//   mandatoryFields.forEach((field) => {
//     updateFields.push(`\`${field}\` = ?`);
//     values.push(req.body[field]);
//   });

//   // Construct the SQL query
//   const updateSql = `UPDATE workdetails SET ${updateFields.join(
//     ", "
//   )} WHERE id = ?`;

//   // Add the id value to the values array
//   values.push(id);

//   con.query(updateSql, values, (err, result) => {
//     if (err) {
//       console.error("Error updating work details:", err);
//       return res.json({ Status: "Error", Error: err });
//     } else {
//       console.log("Work details updated successfully");
//       return res.json({ Status: "Success", Result: result });
//     }
//   });
// });

app.get("/getBioDetails", (req, res) => {
  const sql = "SELECT * FROM devicelogs";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get Bio Details error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/getProject", (req, res) => {
  const sql = "SELECT * FROM project";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/getWrokDetails", (req, res) => {
  const sql = "SELECT * FROM workdetails";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get workdetails error in sql" });
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

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});

app.listen(8081, () => {
  console.log("Running");
});
