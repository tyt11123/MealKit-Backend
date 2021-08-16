class LinkService {
  constructor(knex) {
    this.knex = knex;
  }

  async addLink(link) {
    console.log("Adding Link");
    let query = await this.knex
      .insert({
        title: link.title,
        url: link.url,
      })
      .into("links")
      .returning("id")
      .catch((err) => {
        throw new Error(err);
      });

    link.tags.map(async (tag) => {
      let query1 = await this.knex
        .select("*")
        .from("tags")
        .where("name", "=", tag.name)
        .then(async (data) => {
          console.log(data, tag.name);
          return data;
        })
        .catch((err) => {
          throw new Error(err);
        });

      if (query1[0] === undefined) {
        await this.knex
          .insert({
            name: tag.name,
          })
          .into("tags")
          .returning("id")
          .then(async (data) => {
            await this.knex
              .insert({
                link_id: query[0],
                tag_id: data[0],
              })
              .into("links_tags")
              .returning("id")
              .catch((err) => {
                throw new Error(err);
              });
          });
      } else {
        await this.knex
          .insert({
            link_id: query[0],
            tag_id: query1[0].id,
          })
          .into("links_tags")
          .returning("id")
          .catch((err) => {
            throw new Error(err);
          });
      }
    });
  }

  async list(search) {
    if (search.length > 0) {
      let query = await this.knex
        .select("l.id", "l.title", "l.url", "lt.tag_id", "t.name")
        .from("links as l")
        .join("links_tags as lt", "lt.link_id", "l.id")
        .join("tags as t", "t.id", "lt.tag_id")
        .where("l.title", "ilike", `%${search}%`)
        // .orWhere("l.url", "ilike", `%${search}%`)
        .orWhere("t.name", "ilike", `%${search}%`);

      let linkArray = [];
      console.log(query);
      let prevLink;

      for (let i = 0; i < query.length; i++) {
        if (prevLink === undefined) {
          let tagQuery = await this.knex
            .select("t.name")
            .from("tags as t")
            .join("links_tags as lt", "lt.tag_id", "t.id")
            .where("lt.link_id", `${query[i].id}`);

          linkArray.push({
            ...query[i],
            tags: tagQuery,
          });
        } else if (prevLink.title === query[i].title) {
          console.log("matching link");
        } else {
          let tagQuery = await this.knex
            .select("t.name")
            .from("tags as t")
            .join("links_tags as lt", "lt.tag_id", "t.id")
            .where("lt.link_id", `${query[i].id}`);

          linkArray.push({
            ...query[i],
            tags: tagQuery,
          });
        }

        prevLink = query[i];
      }

      console.log(linkArray);

      return linkArray;
    } else {
      console.log("no search");

      let linkQuery = await this.knex.select("*").from("links");

      let query = await this.knex
        .select("l.id", "l.title", "l.url", "lt.tag_id", "t.name")
        .from("links as l")
        .join("links_tags as lt", "lt.link_id", "l.id")
        .join("tags as t", "t.id", "lt.tag_id");

      let newLinks = [];

      for (let i = 0; i < linkQuery.length; i++) {
        let queryTags = await this.knex
          .select("t.name")
          .from("tags as t")
          .join("links_tags as lt", "lt.tag_id", "t.id")
          .where("lt.link_id", `${linkQuery[i].id}`);

        let link = {
          ...linkQuery[i],
          tags: queryTags,
        };

        newLinks.push(link);
      }

      return newLinks;
    }
  }
}

module.exports = LinkService;
