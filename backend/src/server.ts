import connectDB from './config/db'
import express from "express"


const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000

app.get('/login', (req, res) => {

})

app.get('/register', (req, res) => {
    
})

app.get('/feed', (req, res) => {
    
})

app.get('/post/:id', (req, res) => {
    
})

app.get('/profile/:id', (req, res) => {
    
})

app.get('/search', (req, res) => {
    
})

app.get('/messages', (req, res) => {
    
})

app.get('/messages/:id', (req, res) => {
    
})

app.get('/notifications', (req, res) => {
    
})


app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})