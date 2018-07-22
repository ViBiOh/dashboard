package deploy

import (
	"context"
	"fmt"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/httputils/pkg/rollbar"
)

func (a *App) sendRollbarNotification(ctx context.Context, user *model.User, token, environment, revision string) error {
	if token == `` || environment == `` || revision == `` {
		return nil
	}

	if err := rollbar.Deploy(ctx, token, environment, revision, user.Username); err != nil {
		return fmt.Errorf(`Error while sending deploy request: %v`, err)
	}

	return nil
}
