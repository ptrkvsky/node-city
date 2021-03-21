require('dotenv').config({
    path: `.env.${process.env.NODE_ENV || 'development'}`,
  });
  
  const router = require('express').Router();
  const slugify = require('slugify')
  const sanityClient = require('@sanity/client')
  const helper = require('../helpers/generateId')
  const client = sanityClient({
    projectId: process.env.SANITY_PROJECTID,
    dataset: process.env.SANITY_DATASET,
    token: process.env.SANITY_TOKEN, // we need this to get write access
    useCdn: false // We can't use the CDN for writing
  })
  
  // Upload cities
  // router.get('/test', async (req, res) => {
  //   try {

  //     // Load departements
  //     const query = '*[_type == "departement"]'
  //     const params = {}
      
  //     // Get departements from Sanity
  //     const departements = await client.fetch(query, params);
  //     // Build a table with codes
  //     const codesDepartements = departements.map((departement) => {
  //         return departement.code
  //     })

  //     codesDepartements.map(codeDepartement => {

  //     })

  //     transaction.createOrReplace(sanityPage)
  //     transaction.commit()
  //     res.status(200).json(totalCity);
  
  //   } catch (err) {
  //       console.error(err)
  //       res.status(500).send(err);
  //   }
  // });
  
  
  // Test route 
  router.get('/one', async (req, res) => {

      const linkParentId = helper.generateId(10)
      const sanityPage = {
          _id: 'tototoototo',
          _type: 'page',
          title:"title de ma page",
          longDesc:[
            {
              _key: helper.generateId(10),
              _type: "block",
              style: "normal",
              children: [
                {
                  _key: helper.generateId(10),
                  _type: "span",
                  text: "faire construire une piscine dans les "
                },
                {
                  _key: helper.generateId(10),
                  _type: "span",
                  marks :[
                    linkParentId,
                  ],
                  text: "alpes maritimes"
                },
                {
                  _key: helper.generateId(10),
                  _type: "span",
                  text: "c'est simple quand on est riche "
                },
              ],
              markDefs:[
                {
                  _key: linkParentId,
                  _type:"internalLink",
                  reference: {
                    _ref:"dep-06",
                    _type:"reference"
                  }
                }
              ]
            }
          ],
          departement: {
            _ref: 'dep-01',
            _type:"reference"
          },
          slug: {
            _type:"slug",
            current: 'ain'
          },
      }
      const transaction = client.transaction()
      transaction.createOrReplace(sanityPage)
      transaction.commit()
      res.status(200).json(req.body);
  })
  
  module.exports = router;