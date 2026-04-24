import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import metricsRouter from "./metrics";
import revenueRouter from "./revenue";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth, customersRouter);
router.use(requireAuth, metricsRouter);
router.use(requireAuth, revenueRouter);

export default router;
