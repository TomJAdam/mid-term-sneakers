module.exports = (db) => {



    //listing limited numbers of shoes in terms of different browsing pages
    const sneakersListings = (limit, data = {}) => {
      let queryString = limit ? `SELECT * FROM sneakers` :
        `SELECT COUNT(*) AS count FROM sneakers`;
      let queryParams = [];

      const {
        id,
        brand,
        size,
        city,
        min_price,
        max_price,
        page
      } = data;

      if (id) {
        queryString += queryParams.length ? ` AND` : ` WHERE`;
        queryParams.push(id);
        queryString += ` id = $${queryParams.length}`;
      }
      if (brand) {
        queryString += queryParams.length ? ` AND` : ` WHERE`;
        queryParams.push(`%${brand}%`);
        queryString += ` brand LIKE $${queryParams.length}`;
      }
      if (city) {
        queryString += queryParams.length ? ` AND` : ` WHERE`;
        queryParams.push(`%${city}%`);
        queryString += ` city LIKE $${queryParams.length}`;
      }
      if (min_price) {
        queryString += queryParams.length ? ` AND` : ` WHERE`;
        queryParams.push(min_price);
        queryString += ` price >= $${queryParams.length}`;
      }
      if (max_price) {
        queryString += queryParams.length ? ` AND` : ` WHERE`;
        queryParams.push(max_price);
        queryString += ` price <= $${queryParams.length}`;
      }
      if (size) {
        queryString += queryParams.length ? ` AND` : ` WHERE`;
        queryParams.push(size);
        queryString += ` size = $${queryParams.length}`;
      }
      if (limit && Number.isInteger(limit)) {
        queryParams.push(limit);
        queryString += ` LIMIT $${queryParams.length}`;
        if (page) {
          const offset = limit * (page - 1);
          queryParams.push(offset);
          queryString += ` OFFSET $${queryParams.length}`;
        }
      }
      queryString += `;`;
      return db.query(queryString, queryParams)
        .then(res => res.rows)
        .catch(err => {
          console.log(`Error found: `, err);
        });
    };
    // add sneaker to database
    const addSneaker = function(sneaker) {
        const queryParams = [sneaker.owner_id, sneaker.title, sneaker.brand, sneaker.price, sneaker.size, sneaker.model_year, sneaker.thumbnail_photo_url, sneaker.main_photo_url, sneaker.date_posted, sneaker.country, sneaker.city, sneaker.province];
        return db.query(`
      INSERT INTO sneakers (owner_id, title, brand, price, size, model_year, thumbnail_photo_url, main_photo_url, date_posted, country, city, province)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `, queryParams);
    };

    // add user to database
    const addUser = function(user) {
        const queryParams = [user.name, user.email, user.phone, user.password];
        return db.query(`
      INSERT INTO users (name, email, phone, password)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `, queryParams)
            .then(res => {
                // console.log('res :', res);
                return res.rows[0];
            })
            .catch(console.log);
    };

    //fetch favourites for user
    const getFavouritesForUser = (user_id, limit, data = {}) => {
        const { page, sneaker_id } = data;
        const queryParams = [];
        let queryString = limit ? `SELECT b.* FROM favourites a
            JOIN sneakers b ON a.sneaker_id = b.id ` :
            `SELECT COUNT(*) as count FROM favourites `;

        queryParams.push(user_id);
        queryString += `WHERE user_id = $${queryParams.length}`;
        if (sneaker_id) {
            queryParams.push(sneaker_id);
            queryString += ` AND sneaker_id = $${queryParams.length}`;
        }
        if (limit && Number.isInteger(limit)) {
            queryParams.push(limit);
            queryString += ` LIMIT $${queryParams.length}`;
            if (page) {
                const offset = limit * (page - 1);
                queryParams.push(offset);
                queryString += ` OFFSET $${queryParams.length}`;
            }
        }
        queryString += `;`;

        return db.query(queryString, queryParams)
            .then(res => res.rows)
            .catch(err => {
                console.log(`Error found: `, err);
            });
    };

    // adding sneakers to favourites table
    const addFavouritesForUser = data => {
        const { sneaker_id, user_id } = data;
        const queryString = `INSERT INTO
        favourites (sneaker_id, user_id)
        VALUES ($1, $2) RETURNING *`;

        const queryParams = [sneaker_id, user_id];

        console.log(queryString, queryParams);

        return db.query(queryString, queryParams)
            .then(res => res.rows[0])
            .catch(err => {
                console.log(`Error found: `, err);
            });
    };

    //fetch all sneakers for a user
    const getMyListings = function(user_id, limit, data = {}) {
        const page = data.page;
        const queryParams = [];
        let queryString = limit ? `SELECT *
      FROM sneakers` : `SELECT COUNT(*) FROM sneakers`;
        queryParams.push(user_id);
        queryString += ` WHERE owner_id = $${queryParams.length}`;
        if (limit && Number.isInteger(limit)) {
            queryParams.push(limit);
            queryString += ` LIMIT $${queryParams.length}`;
            if (page) {
                const offset = limit * (page - 1);
                queryParams.push(offset);
                queryString += ` OFFSET $${queryParams.length}`;
            }
        }
        queryString += `;`;
        // console.log(queryString, queryParams);
        return db.query(queryString, queryParams)
            .then(res => {
                return res.rows;
            })
            .catch(err => console.log('error:', err));
    };

    //fetch user with email (login)
    const getUserWithEmail = function(email) {
        return db.query(`
      SELECT *
      FROM users
      WHERE email = $1
      `, [email.toLowerCase()])
            .then(res => {
                return res.rows[0];
            });
    };
    const getUserWithID = function(id) {
        return db.query(`
      SELECT *
      FROM users
      WHERE id = $1
      `, [id])
            .then(res => {
                return res.rows[0];
            });
    };

    const markItemSold = function(sneakerId) {
        return db.query(`
    UPDATE sneakers
    SET sold = true
    WHERE id = $1;
    `, [sneakerId])
            .then(res => res.rows[0]);
    }

    const deleteItem = function(sneakerId) {
        return db.query(`
    DELETE FROM sneakers
    WHERE id = $1;
    `, [sneakerId])
            .then(res => res.rows)
    }

    const getUserWithOwnerId = function(ownerId) {
      return db.query(`
      SELECT *
      FROM users
      JOIN sneakers ON users.id = sneakers.owner_id
      WHERE users.id = $1;
      `, [ownerId])
      .then(res => {
        return res.rows[0]
      })
    }

    return {
        getMyListings,
        getFavouritesForUser,
        sneakersListings,
        addSneaker,
        addUser,
        getUserWithEmail,
        getUserWithID,
        markItemSold,
        deleteItem,
        addFavouritesForUser,
        getUserWithOwnerId
    };
};
