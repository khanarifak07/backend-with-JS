import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { UploadFileOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  /*  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    localVideoPath = req.files?.videoFile[0].path;
  }
  if (
    req.files &&
    Array.isArray(req.files.thumbNail) &&
    req.files.thumbNail.length > 0
  ) {
    localThumbnailPath = req.files?.thumbNail[0].path;
  } */
  const videoFileLocalPath = req.files?.videoFile[0]?.path; //req.files for multiple file (from multer) & req.file.path (for single file)
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  //check for title and description
  if (!title || !description) {
    throw new ApiErrorHandler(400, "title and descriptions are required");
  }
  //check for video and thumbnail path
  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail is required");
  }
  //upload file and thumbnil on cloudinay
  const videoUrl = await UploadFileOnCloudinary(videoFileLocalPath);
  const thumbUrl = await UploadFileOnCloudinary(thumbnailLocalPath);
  //check for vide and thumbnail
  if (!videoUrl || !thumbUrl) {
    throw new ApiError(400, "video and thumbnail not found");
  }

  const videoUploadDetails = await Video.create({
    title,
    description,
    thumbnail: thumbUrl.url,
    videoFile: videoUrl.url,
    duration: videoUrl.duration,
    owner: req.user?._id,
  });
  //return response

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoUploadDetails, "Video Uploaded successfully")
    );

  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!videoId) {
    throw new ApiErrorHandler(400, "Invalid video id");
  }
  if (!userId) {
    throw new ApiErrorHandler(401, "Please login first");
  }
  const video = await Video.findById(videoId); // OR const video = await Video.find({ _id: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video by Id fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;
  const thumbnailLocalFilePath = req.file?.path; // for sinle file --> req.file?.path & for multiple file --> req.files?.thumbnail[0]?.path;
  const thumbUrl = await UploadFileOnCloudinary(thumbnailLocalFilePath);
  const updateVideoDetails = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbUrl.url || thumbnail,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateVideoDetails,
        "video details updated successfully"
      )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted sucessfully"));

  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  //get videoId from params
  //check if videoId exist
  //fetch video from database using id
  //toggle published true/false according to value in video
  //return res
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "VideoId not exist!!");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not available!!");
  }
  
  if (video.isPublished) {
    video.isPublished = false;
  } else {
    video.isPublished = true;
  }

  const updatedVideo = await video.save({ validateBeforeSave: false });

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating video!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully."));
});

export {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
};
