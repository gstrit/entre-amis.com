exports.actions = function(app, repository) {
        


    app.get('/getItems', function (req, res) {

        var itemRepo = repository.extend({
            collectionName: 'item'
        });

        itemRepo.find(function (err, items) {
            if (err) res.json({});

            res.json(items);
        });
    });

};