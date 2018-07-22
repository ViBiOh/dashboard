package deploy

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/httputils/pkg/rollbar"
)

func (a *App) sendRollbarNotification(ctx context.Context, user *model.User, requestParams url.Values) error {
	token := strings.TrimSpace(requestParams.Get(`rollbar_token`))
	environment := strings.TrimSpace(requestParams.Get(`environment`))
	revision := strings.TrimSpace(requestParams.Get(`revision`))
	username := strings.TrimSpace(requestParams.Get(`user`))

	if token == `` || environment == `` || revision == `` {
		return nil
	}

	if username == `` {
		username = user.Username
	}

	if err := rollbar.Deploy(ctx, token, environment, revision, username); err != nil {
		return fmt.Errorf(`Error while sending deploy request: %v`, err)
	}

	return nil
}
