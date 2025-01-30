import { Router } from "express";

import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/user/liked-videos").get(getLikedVideos)
router.route("/video/:videoId").patch(toggleVideoLike)
router.route("/comment/:commentId").patch(toggleCommentLike)

export default router