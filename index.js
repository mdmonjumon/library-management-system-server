require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const app = express()


app.use(express.json())
app.use(cookieParser())
app.use(cors())






const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xt5rphe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {

    const bookOceanDB = client.db("BookOceanDB").collection("books");
    const borrowedBooksDB = client.db("BookOceanDB").collection("borrowed-book")

    try {
        app.get('/', (req, res) => {
            res.send('BookOcean Server running')
        })

        // get all unique category name
        app.get('/categories', async (req, res) => {
            let categories = [];
            const books = await bookOceanDB.find().toArray()
            books.map(book => {
                if (!categories.includes(book.category)) {
                    categories.push(book.category)
                }
            })
            res.send(categories)
        })

        // get all books and category wise books
        app.get('/books', async (req, res) => {
            const query = req.query;
            let filter = {};
            if (query) {
                filter = query
            }
            const books = await bookOceanDB.find(filter).toArray();
            res.send(books)
        })


        // get book by id
        app.get('/book/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookOceanDB.findOne(query);
            res.send(result);
        })


        // decrement book quantity
        app.patch('/book/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateBookQuantity = {
                $inc: { quantity: -1 }
            }
            const result = await bookOceanDB.updateOne(filter, updateBookQuantity);
            res.send(result);
        })


        // borrowed book and user details add to db
        app.post('/borrowed-book', async (req, res) => {
            const data = req.body;
            const result = await borrowedBooksDB.insertOne(data);
            res.send(result);
        })

        // get borrowed books for single user
        app.get('/borrowed-books/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const borrowedBooks = await borrowedBooksDB.find(filter).toArray();
            const allBooks = await bookOceanDB.find().toArray();
            // console.log(borrowedBooks)
            // const borrowedBooksBookId = borrowedBooks.map(borrowedBook => new ObjectId(borrowedBook.bookId))
            const books = [];

                borrowedBooks.map(borrowedBook => {
                    allBooks.find(book => {
                        if (book._id.toString() === new ObjectId(borrowedBook.bookId).toString()) {
                            book.returnDate = borrowedBook.returnDate;
                            books.push(book)
                        }
                    })
                })

            console.log(books)












            res.send([]);


        })






        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`book ocean db listen on port ${port}`)
})
