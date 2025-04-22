module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_comment_delete ON public.comments;

      CREATE TRIGGER after_comment_delete
      AFTER DELETE
      ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION delete_comment_children();

      CREATE OR REPLACE FUNCTION public.delete_comment_children()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      DECLARE
          child_id INTEGER;
          children_ids INTEGER[];
      BEGIN
          -- Find all direct children IDs
          SELECT array_agg(id) INTO children_ids
          FROM comments
          WHERE "parentId" = OLD.id;

          -- If there are children, delete them one by one
          IF children_ids IS NOT NULL THEN
              FOREACH child_id IN ARRAY children_ids LOOP
                  DELETE FROM comments WHERE id = child_id;
              END LOOP;
          END IF;

          RETURN NULL;
      END;
      $function$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS before_comment_delete ON comments;
      DROP FUNCTION IF EXISTS delete_comment_children();
    `);
  },
};
