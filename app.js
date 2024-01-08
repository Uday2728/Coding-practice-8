const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, '/todoApplication.db')

let db = null

const initiateServerAndDB = async () => {
  // initialize DB
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  // initialize server

  app.listen(3000, () => {
    console.log('Server Running at http://localhost:3000')
  })
}

initiateServerAndDB()

const restructuringFunc = todo => {
  return {
    id: todo.todo_id,
    todo: todo.todo_name,
    priority: todo.todo_priority,
    status: todo.todo_status,
  }
}

// 1st API

// todo_id,todo_name,todo_priority,todo_status

app.get('/todos/', async (request, response) => {
  const {status, priority, search_q} = request.query

  let getTodoQuery = 'SELECT * FROM todo '

  if (status) {
    getTodoQuery += `WHERE todo_status='${status}'`
  }

  if (priority) {
    getTodoQuery += status
      ? `AND todo_priority='${priority}'`
      : `WHERE todo_priority='${priority}'`
  }

  if (search_q) {
    const searchQuery = `todo_name LIKE '%${search_q}%'`
    getTodoQuery +=
      status || priority ? `AND ${searchQuery}` : `WHERE ${searchQuery}`
  }
  const dbResponse = await db.all(getTodoQuery)

  const parsedResult = dbResponse.map(each => restructuringFunc(each))

  response.send(parsedResult)

  // const dbResponse = await db.all(getTodoQuery)
  // response.send(dbResponse)
})

// 2nd API
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getDetailsByTodoId = `
  SELECT todo_id as id, todo_name as todo, todo_priority as priority, todo_status as status 
  FROM todo
  WHERE todo_id=${todoId}`
  const dbResponse = await db.get(getDetailsByTodoId)

  response.send(dbResponse)
})

// 3rd API

app.post('/todos/', async (request, response) => {
  const {todo_id, todo_name, todo_priority, todo_status} = request.body
  const postTodoQuery = `
  INSERT INTO todo(todo_id,todo_name,todo_priority,todo_status)
  values(${todo_id},'${todo_name}','${todo_priority}','${todo_status}');`

  await db.run(postTodoQuery)

  response.send('Todo Successfully Added')
})

// // 4th API

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo_name, todo_priority, todo_status} = request.body

  if (todo_status) {
    const updateQuery = `
    UPDATE todo
    SET todo_status='${todo_status}'
    WHERE todo_id=${todoId}`

    await db.run(updateQuery)
    response.send('Status Updated')
  }
  if (todo_priority) {
    const updateQuery = `
    UPDATE todo
    SET todo_priority='${todo_priority}'
    WHERE todo_id=${todoId}`

    await db.run(updateQuery)
    response.send('Priority Updated')
  }

  if (todo_name) {
    const updateQuery = `
    UPDATE todo
    SET todo_name='${todo_name}'
    WHERE todo_id=${todoId}`

    await db.run(updateQuery)
    response.send('Todo Updated')
  }
})

// 5th API

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deletionQuery = `
  DELETE FROM todo WHERE todo_id=${todoId}`
  await db.run(deletionQuery)

  response.send('Todo Deleted')
})
module.exports = app
