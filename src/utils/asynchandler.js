//Higher order fucntion that receives an argumnet as another funtion adn returns a function
//const func = ()=>{} -- normal function
//const func = ()=>{()=>{}} -- higher order fucntion with curly
//cosnt func = ()=>()=>{} -- higher order function without curly

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asyncHandler };
