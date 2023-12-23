import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { UploadFileOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  //take the details from the user --> req.body
  //validate the details
  //check for user is already registered or not
  //check for image avatar
  //upload the image to cloudinary
  //create user object entity in database (.create)
  //remove password and reference token fields
  //check for created user
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
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

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
  //data -- req.body
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
    .cookie("accessToken", accessToken, options) //getting from this --> app.use(cookieParser())
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

const logoutUser = asyncHandler(async (req, res) => {
  //User.findById ?? here we dont have user id in login we have email, username and passoword
  //but while logout we can't give a form to user to fill then we can logout user this is wrong
  //So for this we need to write our auth middleware to verify weather user is there or not from cookies
  //We need to veriyf JWT on the basis of access and refresh token weather he has right token or not that's how we can verify true user
  //If user has true login (correct token) then I can add new object in req e.g. (req.user)
  //After creating and injecting middleware now we have access to user id as req.user._id

  await User.findByIdAndUpdate(
    // this method takes the user id and update the mentioned fields by using (set) operator
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // new is user for new value if we don't set as new then we get the old refreshToken value but our new value is (undefined)
    }
  ); // here we successfully remove the refresh token

  // now we need to clear the cookies for that we need to add options
  const options = {
    httpOnly: true,
    secure: true,
  };

  //now send the response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //we can take the refresh access token from cookies
  //verify the token via jwt so I can get the deccoded refresh token
  //now we can get the user if from decoded token
  //then we need to match the incoming token with the saved refresh token (we saved refres token in generateAccessAndRefreshToken function)
  //now we need to generate the new tokens via cookies

  //1
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  //2.
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //we can get the user id from decoded token
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(409, "Invalid Refresh Token");
    }
    //compare
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token in expired or used");
    }
    //calling functin to geenrate new tokens
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    //cookies sert
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Error While refreshing token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body; //or we can also take confrimPassword if required
  /*  if(!(newPassword === cofirmPassword)){
    throw new ApiError(400,"Password Mismatch")
  } */
  //here we don't have user id so we are going to take user id from req.user (auth middleware)
  const user = await User.findById(req.user?._id);
  //comparing old password (given password) with currrent password
  const isPasswordMatch = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordMatch) {
    throw new ApiError(400, "Invalid Old Password");
  }
  //then we can set new password from user
  user.password = newPassword;
  //then we need to save to the database
  await user.save({ validateBeforeSave: false }); // we don't need to validate all fileds
  //return response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Passoword changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(400, "fullname and email is required");
  }
  //get user from req.user
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName, // this is es6 syntax or we can also write as fullName: fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  //need to remove the password field second approch need to hit another query
  // User.findById(user._id).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account Details Updated Successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path; //here we are file instead of files becasue here we updting one file only --> req.file (from multer)
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await UploadFileOnCloudinary(avatarLocalPath);

  if (!avatar.path) {
    throw new ApiError(400, "Error while uploading avatar image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Avatar Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path; //req.file for single and req.files for multiple (from multer)

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is missing");
  }

  const coverImage = await UploadFileOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.path,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Cover Image updated successfully"));
});



export {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
