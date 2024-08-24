const asyncHandler = (requestHandler) => async (req, res, next) => {
    try {
        return await requestHandler(req, res, next)
    } catch (error) {
        // res.status(error.code || 500).json({
        //     success: false,
        //     message: error.message
        // })
        next(error)
    }
}

export default asyncHandler

// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next))
//         .catch((error) => next(error))
//     }
// }