import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import metricsRouter from "./metrics";
import revenueRouter from "./revenue";

const router: IRouter = Router();

router.use(healthRouter);
router.use(customersRouter);
router.use(metricsRouter);
router.use(revenueRouter);

export default router;
