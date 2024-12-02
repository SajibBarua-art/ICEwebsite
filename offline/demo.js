app.post("/", async (req, res) => {
  try {
    const courseDetails = new CourseDetails(req.body);
    let result = await courseDetails.save();

    if (result) {
      // Fetch all courses after saving the new one
      let results = await CourseDetails.find({});
      results = results.map((doc) => doc.toObject());

      // Sort the results based on the part of the code after the dash
      results.sort((a, b) => {
        const aa = a.code.split("-");
        const bb = b.code.split("-");
        const lastA = aa[1];
        const lastB = bb[1];
        return lastA.localeCompare(lastB);
      });

      res.send({ success: true, data: results });
    } else {
      res.send({
        success: false,
        error: "Your provided course code is already registered!",
      });
      console.log("This course details already registered");
    }
  } catch (e) {
    console.error(e);
    res.send({ success: false, error: "Internal Server Error!" });
  }
});
