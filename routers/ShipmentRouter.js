const express = require("express");
const { isAuth, isAdmin, } = require('../util');

class ShipmentRouter {
    constructor(knex, transporter) {
        this.knex = knex;
        this.transporter = transporter;
    };
    router() {
        let router = express.Router();
        router.put("/:id/time", isAuth, isAdmin, this.put_id_time.bind(this));

        return router;
    };

    async put_id_time(req, res) {
        try {
            const shipment = await this.knex("shipment").where({_id: Number(req.params.id)});
            if (shipment[0]) {
                const { time } = req.body;
                await this.knex("shipment").where({_id: Number(req.params.id)}).update({ time });
                const updatedShipment = {...shipment[0], time };
                res.send({ message: 'Shipment updated.', shipment: updatedShipment });
            } else {
            res.status(404).send({ message: 'Shipment not found.' })
            };
        }
        catch (error) {
            res.status(401).send({ message: error.message });
        }
    };
};

module.exports = ShipmentRouter;