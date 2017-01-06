debug    = require('debug')('linda-server:controller:main')

module.exports = (app) ->

  config       = app.get 'config'
  linda        = app.get 'linda'
  package_json = app.get 'package'


  app.get '/', (req, res) ->
    args =
      title: config.title
      package: package_json
    return res.render 'index', args


  app.get '/:tuplespace', (req, res) ->
    name = req.params.tuplespace
    tuple = {}
    for k,v of req.query
      if typeof v is 'string' and /^([1-9]\d+|\d)(\.\d+)?$/.test v
        tuple[k] = v - 0
      else
        tuple[k] = v

    args =
      req: req
      name: name,
      tuple: tuple,
      title: "#{name} / #{JSON.stringify(tuple)}"
      package: package_json

    return res.render 'tuplespace', args
