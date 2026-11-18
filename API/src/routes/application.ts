import express from "express";

import { createApplication, getAllApplication, getApplicationById, getApplicationIncidentHistory, removeApplication, updateApplication } from "../controllers/applications.ts";
import { getAllApplicationHealth, getHealthSnapshot } from "../controllers/healthSnapshot.ts";

const router = express.Router();

router.route("/application")
    .get(getAllApplication)
    .post(createApplication);

router.route("/healthSnapshot")
    .get(getHealthSnapshot)
router.route("/healthSnapshotStatic")
    .get(getAllApplicationHealth)

router.route("/application/:id")
    .put(updateApplication)
    .delete(removeApplication)
    .get(getApplicationById)

router.route("/application/:id/incidents")
    .get(getApplicationIncidentHistory)

export default router;