import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { asyncHandler } from "../utils/asynchandler.js";
import { UploadFileOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  //take the details from the user
  //validate the details
  //check for existing user
  //check for image avatar
  //upload the image to cloudinary
  //create user object entity in database
  //remove password and reference token fields
  //check for creates user
  //send the response

  //1
  const { username, email, password, fullName } = req.body;

  //2
  if (
    [username, email, password, fullName].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //3
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Username or email is already existed");
  }

  //4
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //5
  const avatar = await UploadFileOnCloudinary(avatarLocalPath);
  const coverImage = await UploadFileOnCloudinary(coverImageLocalPath);

  //6
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  //7
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //8
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  //9
  res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

const generateAccessAndRefreshTokens = async function (userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken;
    const refreshToken = user.generateRefreshToken;
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //enter credentials -- req.body
  //check for email or username
  //check user is registered or not
  //check password is correct
  //generate access and refresh tokens
  //remove the password and refresh token fields
  //create options for cookies to send in response
  //send response

  //1
  const { username, email, password } = req.body;

  //2
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }
  //3
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User is not registered or not found");
  }

  //4
  const isPasswordValidate = user.isPasswordCorrect(password);
  if (!isPasswordValidate) {
    throw new ApiError(401, "Invalid Credentials");
  }

  //5
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  //6
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //7
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export { loginUser, registerUser };
