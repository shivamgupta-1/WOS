import express from "express";

import { createDomain, getAllDomain, getDomainById, removeDomain, updateDomain } from "../controllers/domain.ts";

const router = express.Router();

router.route("/domain")
    .post(createDomain)
    .get(getAllDomain)

router.route("/domain/:id")
    .put(updateDomain)
    .delete(removeDomain)
    .get(getDomainById)


export default router;