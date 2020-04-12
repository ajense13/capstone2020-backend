const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const sqlite = require('sqlite3').verbose()

router.use(bodyParser.urlencoded({ extended: false}))
router.use(bodyParser.json())

const database = new sqlite.Database('./database/portal.db')

const createViewsTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS views (
    user_id integer,
    type text,
    id integer,
    title text,
    image text,
    show_user text)`
  return database.run(query)
}

const createWatchedTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS watched (
    user_id integer,
    type text,
    id integer,
    title text,
    watched_image text,
    resume text,
    season integer,
    episode integer,
    rating number)`
  return database.run(query)
}

const createSavedTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS saved (
    user_id integer,
    list text,
    type text,
    id integer,
    title text,
    image text)`
}

const findViewsById = (user_id, callback) => {
  return database.get(`SELECT * FROM views WHERE user_id = ?`, user_id, (error, row) => {
    callback(error, row)
  })
}

const findWatchedById = (user_id, resume, callback) => {
  return database.get(`SELECT * FROM watched WHERE user_id = ? AND resume = ?`, [user_id, resume], (error, row) => {
    callback(error, row)
  })
}

const findSavedById = (user_id, callback) => {
  return database.get(`SELECT * FROM saved WHERE user_id = ?`, user_id, (error, row) => {
    callback(error, row)
  })
}

const addView = (user_id, views_type, views_id, views_title, views_image, callback) => {
  const query = `INSERT INTO views (user_id, views_type, views_id, views_title, views_image, show_user) VALUES (?, ?, ?, ?, ?, ?)`
  const values = [user_id, views_type, views_id, views_title, views_image, 'true']
  return database.get(query, values, (error) => {
    callback(error)
  })
}

const addWatched = (user_id, watched_type, watched_id, watched_title, watched_image, resume, season, episode, rating, callback) => {
  const query = `INSERT INTO watched (user_id, watched_type, watched_id, watched_title, watched_image, resume, season, episode, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  const values = [user_id, watched_type, watched_id, watched_title, watched_image, season, episode, rating];
  return database.get(query, values, (error) => {
    callback(error)
  })
}

const addSaved = (user_id, list_type, saved_type, saved_id, saved_title, saved_image, callback) => {
  const query = `INSERT INTO saved (user_id, list_type, saved_type, saved_id, saved_title, saved_image) VALUES (?, ?, ?, ?, ?, ?)`
  const values = [user_id, list_type, saved_type, saved_id, saved_title, saved_image]
  return database.get(query, values, (error) => {
    callback(error)
  })
}

const removeSaved = (user_id, list_type, saved_type, saved_id, callback) => {
  const query = `DELETE FROM saved WHERE user_id = ? AND list_type = ? AND saved_type = ? AND saved_id = ?`
  const values = [user_id, list_type, saved_type, saved_id]
  return database.get(query, values, (error) => {
    callback (error)
  })
}

createViewsTable()
createWatchedTable()
createSavedTable()

const handleError = (res, errorNum) => {
  switch (errorNum) {
    case 19: return res.status(409).send('User information already entered')
    case 'views': return res.status(404).send('User view history not found!')
    case 'watched': return res.status(404).send('User watch history not found')
    case 'saved': return res.status(404).send('User save history not found')
    default: return res.status(500).send('Server Error')
  }
}

router.post('/', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']

  findViewsById(user_id, (error, views) => {
    if (error) handleError(res, error.errno)
    else findWatchedById(user_id, (error, watched) => {
      if (error) handleError(res, error.errno)
      else findSavedById(user_id, (error, saved) => {
        if (error) handleError(res, error.errno)
        else res.status(200).send({ views, watched, saved })
      })
    })
  })
})

router.post('/views', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']

  findViewsById(user_id, (error, views) => {
    if (error) handleError(res, error.errno)
    else if (!views) handleError (res, 'watched')
    else res.status(200).send(views)
  })
})

router.post('/views/add', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']
  const views_type = req.body['type']
  const views_id = req.body['id']
  const views_title = req.body['title']
  const views_image = req.body['image']

  addView(user_id, views_type, views_id, views_title, views_image, (error) => {
    if (error) handleError(res, error.errno)
    else findViewsById(user_id, (error, views) => {
      if (error) handleError(res, error.errno)
      else if (!views) handleError(res, 'views')
      else res.status(200).send(views)
    })
  })
})

router.post('/watched', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']
  const resume = req.body['resume']

  findWatchedById(user_id, resume, (error, watched) => {
    if (error) handleError(res, error.errno)
    else if (!watched) handleError (res, 'watched')
    else res.status(200).send(watched)
  })
})

router.post('/watched/add', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']
  const watched_type = req.body['type']
  const watched_id = req.body['id']
  const watched_title = req.body['title']
  const watched_image = req.body['image']
  const resume = req.body['resume']
  const season = req.body['season']
  const episode = req.body['episode']
  const rating = req.body['rating']

  addWatched(user_id, watched_type, watched_id, watched_title, watched_image, resume, season, episode, rating, (error) => {
    if (error) handleError(res, error.errno)
    else findWatchedById(user_id, (error, watched) => {
      if (error) handleError(res, error.errno)
      else if (!watched) handleError(res, 'watched')
      else res.status(200).send(watched)
    })
  })

})

router.post('/saved', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']

  findSavedById(user_id, (error, saved) => {
    if (error) handleError(res, error.errno)
    else if (!saved) handleError (res, 'saved')
    else res.status(200).send(saved)
  })
})

router.post('/saved/add', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']
  const list_type = req.body['list']
  const saved_type = req.body['type']
  const saved_id = req.body['id']
  const saved_title = req.body['title']
  const saved_image = req.body['image']

  addSaved(user_id, list_type, saved_type, saved_id, saved_title, saved_image, (error) => {
    if (error) handleError(res, error.errno)
    else findSavedById(user_id, (error, saved) => {
      if (error) handleError(res, error.errno)
      else if (!saved) handleError(res, 'saved')
      else res.status(200).send(saved)
    })
  })
})

router.post('/saved/remove', (req, res) => {
  console.log(req.body)

  const user_id = req.body['userId']
  const list_type = req.body['list']
  const saved_type = req.body['type']
  const saved_id = req.body['id']

  removeSaved(user_id, list_type, saved_type, saved_id, (error) => {
    if (error) handleError(res, error.errno)
    else findSavedById(user_id, (error, saved) => {
      if (error) handleError(res, error.errno)
      else if (!saved) handleError(res, 'saved')
      else res.status(200).send(saved)
    })
  })
})
