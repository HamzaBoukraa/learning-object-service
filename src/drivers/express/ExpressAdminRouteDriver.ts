import { Router } from 'express';

export class ExpressAdminRouteDriver {
  public static buildRouter(): Router {
    const e = new ExpressAdminRouteDriver();
    const router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private setRoutes(router: Router): void {
    router.route('/learning-objects').get(async (req, res) => {
      res.redirect(
        301,
        req.originalUrl.replace('/admin/learning-objects', `/learning-objects`),
      );
    });
    router.route('/learning-objects').patch(async (req, res) => {
      const learningObject = req.body.learningObject;
      const username = req.user.username;
      const newRoute = `/users/${username}/learning-objects/${
        learningObject.id
      }`;
      res.redirect(
        301,
        req.originalUrl.replace('/admin/learning-objects', newRoute),
      );
    });
    router
      .route('/learning-objects/:learningObjectId')
      .get(async (req, res) => {
        res.redirect(
          301,
          req.originalUrl.replace(
            '/admin/learning-objects',
            '/learning-objects',
          ),
        );
      });
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/publish',
      async (req, res) => {
        // Respond to clients that this functionality is now gone
        res.sendStatus(410);
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unpublish',
      async (_, res) => {
        // Respond to clients that this functionality is now gone
        res.sendStatus(410);
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/lock',
      async (req, res) => {
        // Respond to clients that this functionality is now gone
        res.sendStatus(410);
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unlock',
      async (req, res) => {
        // Respond to clients that this functionality is now gone
        res.sendStatus(410);
      },
    );
    router.delete(
      '/users/:username/learning-objects/:learningObjectName',
      async (req, res) => {
        const learningObjectName = req.params.learningObjectName;
        const username = req.user.username;
        res.redirect(
          301,
          req.originalUrl.replace(
            req.originalUrl,
            `/users/${username}/learning-objects/${learningObjectName}`,
          ),
        );
      },
    );

    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        res.redirect(
          301,
          req.originalUrl.replace(
            '/admin/learning-objects',
            `/learning-objects`,
          ),
        );
      },
    );
  }
}
