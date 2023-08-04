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
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
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

app.post("/create", upload.single("employeeImage"), (req, res) => {
  const sql =
    "INSERT INTO employee (`employeeName`,`EMPID`,`employeeEmail`, `userName`,`password`, `discipline`,`designation`, `date`, `employeeImage`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [
      req.body.employeeName,
      req.body.EMPID,
      req.body.employeeEmail,
      req.body.userName,
      hash,
      req.body.discipline,
      req.body.designation,
      req.body.date,
      req.file.filename,
    ];
    con.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside singup query" });
      return res.json({ Status: "Success" });
    });
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
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are no Authenticated" });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) return res.json({ Error: "Token wrong" });
      req.role = decoded.role;
      req.id = decoded.id;
      next();
    });
  }
};

app.get("/dashboard", verifyUser, (req, res) => {
  return res.json({ Status: "Success", role: req.role, id: req.id });
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
  const sql = "SELECT * FROM users Where email = ? AND  password = ?";
  con.query(sql, [req.body.email, req.body.password], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      const id = result[0].id;
      const token = jwt.sign({ role: "admin" }, "jwt-secret-key", {
        expiresIn: "1d",
      });
      res.cookie("token", token);
      return res.json({ Status: "Success" });
    } else {
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});

app.post("/employeelogin", (req, res) => {
  const sql = "SELECT * FROM employee Where email = ?";
  con.query(sql, [req.body.email], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign(
              { role: "employee", id: result[0].id },
              "jwt-secret-key",
              { expiresIn: "1d" }
            );
            res.cookie("token", token);
            return res.json({ Status: "Success", id: result[0].id });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong Email or Password",
            });
          }
        }
      );
    } else {
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});

//teamLead Oprationss

app.post("/lead/create", upload.single("image"), (req, res) => {
  const sql =
    "INSERT INTO team_lead (`leadName`,`teamName`,`userName`, `password`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [
      req.body.leadName,
      req.body.teamName,
      req.body.userName,
      hash,
    ];
    con.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside singup query" });
      return res.json({ Status: "Success" });
    });
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
  const sql = "SELECT * FROM team_lead Where email = ?";
  con.query(sql, [req.body.email], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign(
              { role: "teamLead", id: result[0].id },
              "jwt-secret-key",
              { expiresIn: "1d" }
            );
            res.cookie("token", token);
            return res.json({ Status: "Success", id: result[0].id });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong Email or Password",
            });
          }
        }
      );
    } else {
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});

//Hr Api
app.post("/hr/create", (req, res) => {
  const sql = "INSERT INTO hr (`hrName`,`userName`,`password`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [req.body.hrName, req.body.userName, hash];
    con.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside singup query" });
      return res.json({ Status: "Success" });
    });
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
  const sql = "SELECT * FROM hr Where email = ?";
  con.query(sql, [req.body.email], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign(
              { role: "hr", id: result[0].id },
              "jwt-secret-key",
              { expiresIn: "1d" }
            );
            res.cookie("token", token);
            return res.json({ Status: "Success", id: result[0].id });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong Email or Password",
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
    "INSERT INTO project (`tlName`,`orderId`,`positionNumber`, `subPositionNumber`,`projectNo`,`taskJobNo`,`prjectName`,`subDivision`,`startDateOrderreleasedDate`,`targetDate`,`allotatedHours`) VALUES (?)";
  const values = [
    req.body.tlName,
    req.body.orderId,
    req.body.positionNumber,
    req.body.subPositionNumber,
    req.body.projectNo,
    req.body.taskJobNo,
    req.body.prjectName,
    req.body.subDivision,
    req.body.startDateOrderreleasedDate,
    req.body.targetDate,
    req.body.allotatedHours,
  ];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Inside singup query" });
    return res.json({ Status: "Success" });
  });
});

app.get("/getProject", (req, res) => {
  const sql = "SELECT * FROM project";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
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
