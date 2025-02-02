import { Router } from "express";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
} from "../controllers/playlist.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);
router.route("/:playlistId").get(getPlaylistById).delete(deletePlaylist);
router.route("/user/playlists").get(getUserPlaylists);
router.route("/add-video/:playlistId/:videoId").patch(addVideoToPlaylist);
router
  .route("/remove-video/:playlistId/:videoId")
  .patch(removeVideoFromPlaylist);

export default router;
