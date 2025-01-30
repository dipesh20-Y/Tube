import { Router } from "express";

import {
  fetchAllComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/video/:videoId").get(fetchAllComments).post(addComment);
router.route("/comments/:commentId").patch(updateComment).delete(deleteComment)

export default router;