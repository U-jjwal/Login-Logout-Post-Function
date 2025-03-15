const express = require('express');
const app = express();
const userModel = require('./modules/user');
const postModel = require("./modules/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt'); //use for securing passwd adding salt
const jwt = require('jsonwebtoken'); // use so that user stays logdin by sending cookie
const crypto = require("crypto");
const path = require("path");
const upload = require("./config/multerconfig");


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());





app.get('/', (req, res) => {
    res.render("index");
 
});


app.get('/profile/upload', (req, res) => {
    res.render("profileupload");
 
});


app.post('/upload', isLoggedIn ,upload.single("image"), async (req, res) => {
  let user =  await userModel.findOne({email: req.user.email})
  user.profilepic = req.file.filename;
  await user.save()
  res.redirect("/profile");
   
 
});


app.get('/login', (req, res) => {
    res.render("login");
 
});

app.get('/profile', isLoggedIn, async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email }).populate("posts");
    
    res.render("profile", {user})
});



app.get('/like/:id', isLoggedIn, async (req, res) => {
    const post = await postModel.findOne({_id: req.params.id}).populate("user");


    if(post.likes.indexOf(req.user.userid) === -1){
        
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }



    await post.save();   
    res.redirect("/profile");
});



app.get('/edit/:id', isLoggedIn, async (req, res) => {
    const post = await postModel.findOne({_id: req.params.id}).populate("user");

    res.render("edit", {post})
   
});




app.post('/update/:id', isLoggedIn, async (req, res) => {
    const post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});

    res.redirect("/profile");


   
});


app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email})
    let { content } =req.body;
   let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
   
 });



app.post('/register',  async (req, res) => {
    //first we will check wheather users email/id already exist's or not so for that
    let {email, password, username, name, age} = req.body;

    let user = await userModel.findOne({email}); 
    if(user) return res.status(500).send("user already registered");

    //if user is not there then we have to create it so for that we"ll use bcrypt
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash,
            });
            //user got created now we have to send token to login so we"ll user jwt for that 
           const token = jwt.sign({email: email, userid: user._id}, "shhhh");
            res.cookie("token", token);
            res.send("registered");
        })
    })


});


app.post('/login',  async (req, res) => {
    //first we will check whether users email/id already exists or not
    const {email, password} = req.body;

    const user = await userModel.findOne({email}); 
    if(!user) return res.status(500).send("Something Went Wrong");

    bcrypt.compare(password, user.password, (err, result) => {
        if(result) {
            let token = jwt.sign({email: email, userid: user._id}, "shhhh");
            res.cookie("token", token);
            res.status(200).render("profile", { user });  // Render the profile template directly
        }
        else res.redirect("/login");
    });
});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

function isLoggedIn(req, res, next){
    if(req.cookies.token === "") res.redirect("/login");

    else{
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    }
}



app.listen(5000);