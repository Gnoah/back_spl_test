const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require("request")
const validateRegisterInput = require('../register');
const validateLoginInput = require('../login');
const Atelier = require('../modele/modele.atelier');
const Particulier = require('../modele/modele.particulier');
const Cuisinier = require('../modele/modele.cuisinier');
router.post('/register', function (req, res) {
    Cuisinier.find().then(use => {
        const { errors, isValid } = validateRegisterInput(req.body);
        var id;
        if (use.length == 0) {
            id = 0
        }
        else {
            id = use[use.length - 1]._id + 1
        }
        if (!isValid) {
            return res.status(400).json(errors);
        }
        Cuisinier.findOne({
            email: req.body.email
        }).then(user => {
            if (user) {
                return res.status(400).json({
                    email: 'Email already exists'
                });
            }
            else {
                const avatar = gravatar.url(req.body.email, {
                    s: '200',
                    r: 'pg',
                    d: 'mm'
                });
                const cuisinier = new Cuisinier({
                    _id: id,
                    nom: req.body.nom,
                    prenom: req.body.prenom,
                    email: req.body.email,
                    password: req.body.password,
                    specialite: req.body.specialite,
                    avatar
                });

                bcrypt.genSalt(10, (err, salt) => {
                    if (err) console.error('There was an error', err);
                    else {
                        bcrypt.hash(cuisinier.password, salt, (err, hash) => {
                            if (err) console.error('There was an error', err);
                            else {
                                cuisinier.password = hash;
                                cuisinier
                                    .save()
                                    .then(user => {
                                        res.json(user)
                                    });
                            }
                        });
                    }
                });
            }
        });
    })


});

router.post('/login', (req, res) => {

    const { errors, isValid } = validateLoginInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    Cuisinier.findOne({ email })
        .then(user => {
            if (!user) {
                errors.email = 'User not found'
                return res.status(404).json(errors);
            }
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        const payload = {
                            id: user.id,
                            nom: user.nom,
                            avatar: user.avatar
                        }
                        jwt.sign(payload, 'secret', {
                            expiresIn: 3600
                        }, (err, token) => {
                            if (err) console.error('There is some error in token', err);
                            else {
                                res.json({
                                    id: user.id,
                                    nom: user.nom,
                                    success: true,
                                    token: `Bearer ${token}`
                                });
                            }
                        });
                    }
                    else {
                        errors.password = 'Incorrect Password';
                        return res.status(400).json(errors);
                    }
                });
        });
});
router.get('/cuisine', (req, res) => {
    Cuisinier.find().then(user => res.send(user))
})
router.post("/cuisinier/:_id", (req, res) => {
    res.setHeader('Content-type', 'text/plain');
    Cuisinier.findById(req.params._id).then(user => {

        if (!user) {
            res.send("intouvable")
        }
        else {
            Atelier.find().then(use => {
                // const { errors, isValid } = validateRegisterInput2(req.body);

                // let increm;
                // if(user.length == 0){
                //     increm = 0
                // }else {
                //     increm = parseInt(user[user.length - 1]._id) + 1
                // }
                // console.log(req.body);

                // // //images
                // let imageFile = req.files.image;
                // let nomImage = increm
                // console.log(req.files);

                // imageFile.mv(`${__dirname}/public/${nomImage}.jpg`, function(err) {
                // if (err) {
                //     return res.status(500).send(err);
                // }

                // });

                var id;
                if (use.length == 0) {
                    id = 0
                }
                else {
                    id = use[use.length - 1]._id + 1
                }
                // if(!isValid) {
                //     return res.status(400).json(errors);
                // }
                let imageFile1 = req.files.image;
                let nomImage = id
                // let nomImage = increm
                console.log(req.files);

                imageFile1.mv(`${__dirname}/public/${nomImage}.jpg`, function (err) {
                    if (err) {
                        return res.status(500).send("err");
                    }
                })

                const atelier = new Atelier({
                    _id: id,
                    id2: user._id,
                    titre: req.body.titre,
                    description: req.body.description,
                    date: req.body.date,
                    horaire: req.body.horaire,
                    placedispo: req.body.placedispo,
                    placereserve: 0,
                    prix: req.body.prix,
                    image: '' + nomImage + '.jpg',
                    visibilite: true

                });





                atelier
                    .save()
                    .then(user => {
                        res.json(user)
                    }).catch(use => console.log("ereue")
                    )

            });
        }

    })
})
router.get("/cuisinier/:_id", (req, res) => {

    Atelier.find().then(user => {
        const tab = []
        for (let i = 0; i < user.length; i++) {
            if (user[i].id2 == req.params._id) {
                tab.push(user[i])
                console.log(tab);

            }

        }
        if (tab.length > 0) {
            res.send(tab)
        }
        else {
            res.send([])
        }


    })
    Atelier.find().then(produit => {
        for (let i = 0; i < produit.length; i++) {
            router.get("/public/" + produit[i].image, (req, res) => {
                var fs = require("fs")
                console.log("./route.js/public/" + produit[i].image);

                var image = fs.readFileSync("./route.js/public/" + produit[i].image)
                res.send(image)
            })
        }
    })


})
Atelier.find().then(produit => {

    for (let i = 0; i < produit.length; i++) {
        console.log(produit[i].image)
        router.get("/public/" + produit[i].image, (req, res) => {
            var fs = require("fs")
            console.log("./route.js/public/" + produit[i].image);

            var image = fs.readFileSync("./route.js/public/" + produit[i].image)
            res.send(image)
        })
    }
})

router.get('/atelier', (req, res) => {

    Atelier.find().then(user => {

        res.send(user)




    })

    Atelier.find().then(produit => {
        for (let i = 0; i < produit.length; i++) {
            router.get("/public/" + produit[i].image, (req, res) => {
                var fs = require("fs")
                console.log("./route.js/public/" + produit[i].image);

                var image = fs.readFileSync("./route.js/public/" + produit[i].image)
                res.send(image)
            })
        }
    })

})
router.post("/particulier/:_id", (req, res) => {
    Particulier.find().then(use => {
        // const { errors, isValid } = validateRegisterInput(req.body);
        var id;
        if (use.length == 0) {
            id = 0
        }
        else {
            id = use[use.length - 1]._id + 1
        }

        Atelier.findById(req.params._id).then(use => {
            const particulier = new Particulier({
                _id: id,
                nom: req.body.nom,
                prenom: req.body.prenom,
                email: req.body.email,
                telephone: req.body.telephone,


            });
            Atelier.findByIdAndUpdate(use._id, {
                _id: use.id,
                id2: use.id2,
                titre: use.titre,
                description: use.description,
                date: use.date,
                horaire: use.horaire,
                duree: use.duree,
                placereserve: use.placereserve + 1,
                placedispo: use.placedispo - 1,
                prix: use.prix,
                image: use.image,

            }).then(upd => console.log(upd)
            )
            particulier
                .save()
                .then(user => {
                    res.json(user)
                });
        });

    });
})
router.get("/ateliermasquer/:_id", (req, res) => {

    Atelier.findOneAndUpdate({ _id: req.params._id }, {
        visibilite: false

    }, { new: true }).then(upd => res.send(upd)
    )

})


router.get("/atelieraffichier/:_id", (req, res) => {
    Atelier.findOneAndUpdate({ _id: req.params._id }, {
        visibilite: true

    }, { new: true }).then(upd => res.send(upd)
    )
})

router.put('/atelieraffichier/:_id', (req, res) => {

    console.log('ity ny requete'+req.body.nom) 
   
        let imageFile = req.files.image; 
    console.log('inona ny ato o!'+imageFile) 
    let nomImage = req.params._id
    res.setHeader('Content-Type', 'text/plain');
    imageFile.mv(`${__dirname}/public/${nomImage }.jpg`, function(err) { 
        if (err) { 
            return res.status(500).send(err); 
        } 
    }); 
    console.log(req.params._id);
    
    console.log('tonga eto v nw') 
    // Find and update eleve with the request body 
    Atelier.findOneAndUpdate({_id: req.params._id}, { 
        titre: req.body.titre, 
        prix: req.body.prix, 
        description: req.body.description, 
        image: nomImage + '.jpg', 
        duree: req.body.duree, 
        palcedispo: req.body.placedispo, 
        placereserve: req.body.placereserve
}, { new: true }).then(user => { 
    if (!user) { 
        return res.status(404).send(
            { 
                message: "eleve not found with id " + req.params._id 
            }); 
        } res.send(user); })
        .catch(err => {
    if (err.kind === 'ObjectId') {
        return res.status(404).send(
            { 
                message: "eleve not found with id " + req.params._id 
            });
    } 
    return res.status(500).send(
        { 
            message: "Something wrong updating note with id " + req.params._id 
        });
    }); 
});

// router.put('/atelieraffichier/:_id',(req, res) => {
//     // Validate Request
//     if(!req.body.titre) {
//         return res.status(400).send({
//             message: "Person content can not be empty"
//         });
//     }

//     // Find Person and update it with the request body
//     Atelier.findByIdAndUpdate(req.params._Id, {
//         titre: req.body.titre || "Unamed Personne", 
//         description: req.body.description,
//         date: req.body.date,
//         horaire: req.body.horaire,
//         duree: req.body.duree,
//         placedispo: req.body.placedispo,
//         placereserve: rezq.body.placereserve,
//         prix: req.body.prix,
//         image:'' + nomImage +'.jpg'
//     }, {new: true})
//     .then(user => {
//         if(!user) {
//             return res.status(404).send({
//                 message: "Person not found with id " + req.params._Id
//             });
//         }
//         res.send(user);
//     }).catch(err => {
//         if(err.kind === 'ObjectId') {
//             return res.status(404).send({
//                 message: "Person not found with id " + req.params._Id
//             });                
//         }
//         return res.status(500).send({
//             message: "Error updating person with id " + req.params._Id
//         });
//     });
// });

router.delete('/atelier/:_id',(req, res) => {
    Atelier.findById(req.params._id)
      .then(atelier =>
        atelier.remove().then(() =>
          res.json({
            success: true
          })
        )
      )
      .catch(err =>
        res.status(404).json({
          succes: false
        })
      );
  })


module.exports = router;