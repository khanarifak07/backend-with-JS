import jwt from "jsonwebtoken";
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
  //but while logout we can give a form to user to fill then we can logout user
  //Then user can  fill the form with any id but this is wrong
  //So for this we need to write our auth middleware to verify weather user is there or not
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
  //check the token
  //verify the token via jwt so I can get the deccoded refresh token
  //now we can get the user if from decoded token
  //then we need to match the incoming token with the saved refresh token (we saved refres token in generateAccessAndRefreshToken function)
  //now we need to generate the new tokens via cookies

  //1
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  //2.
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ApiError(400, "Invalid Refresh Access Token");
    }
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

export { loginUser, logoutUser, registerUser, refreshAccessToken };
