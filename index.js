const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 9000;

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://mobile-banking-client.vercel.app"
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ff1pkvw.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware
const logger = async (req, res, next) => {
  // console.log('called', req.host, req.originalUrl)
  next();
};
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unothorized" });
    }
    // console.log(decoded)
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("bankingDB").collection("users");
    const requestCollection = client.db("bankingDB").collection("requests");
    const transactionRequestCollection = client
      .db("bankingDB")
      .collection("transactionRequests");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // save an user in database
    app.post("/users", async (req, res) => {
      const userData = req.body;
      const result = await userCollection.insertOne(userData);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      console.log(req.query.email);
      console.log("token owner info", req.user);
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    // update an user in dataBase
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const updateData = req.body;
      console.log(updateData);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updateData,
        },
      };
      try {
        const result = await userCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.post("/requests", async (req, res) => {
      const requestData = req.body;
      console.log(requestData);
      const result = await requestCollection.insertOne(requestData);
      res.send(result);
    });
    app.get("/requests", async (req, res) => {
      const result = await requestCollection.find().toArray();
      res.send(result);
    });

    app.post("/transactionRequests", async (req, res) => {
      const data = req.body;
      const result = await transactionRequestCollection.insertOne(data);
      res.send(result);
    });
    app.get("/transactionRequests", async (req, res) => {
      const result = await transactionRequestCollection.find().toArray();
      res.send(result);
    });
    app.get("/transactionRequests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await transactionRequestCollection.findOne(query);
      res.send(result);
    });
    app.put("/transactionRequests/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const updateData = req.body;
      console.log(updateData);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updateData,
        },
      };
      try {
        const result = await transactionRequestCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from Mobile Banking Server....");
});
app.listen(port, () => console.log(`Server running on port ${port}`));
