debug    = require('debug')('linda-server:controller:api')

module.exports = (app) ->

  config       = app.get 'config'
  linda        = app.get 'linda'
  package_json = app.get 'package'


  app.post '/:tuplespace', (req, res) ->
    res.header 'Access-Control-Allow-Origin', '*'
    res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
    res.header 'Access-Control-Allow-Headers', 'Content-Type'

    from = req.connection.remoteAddress or 'unknown'
    name = req.params.tuplespace
    try
      tuple = JSON.parse req.body.tuple
    catch
      res.status(400).end 'Bad Request: invalid JSON'
      return

    data =
      tuplespace: name
      tuple: tuple

    linda.tuplespace(name).write tuple, {from: from}
    debug "write\t#{JSON.stringify data} from #{from}"

    return res.end JSON.stringify tuple
