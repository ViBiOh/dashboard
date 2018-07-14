package deploy

import (
	"context"
	"fmt"
	"net/http"
	"net/url"

	"github.com/ViBiOh/auth/pkg/model"
	"github.com/ViBiOh/httputils/pkg/request"
)

func (a *App) sendEmailNotification(ctx context.Context, user *model.User, appName string, services map[string]*deployedService, success bool) error {
	if a.mailerURL == `` || a.mailerUser == `` || a.mailerPass == `` {
		return nil
	}

	if user.Email == `` {
		return fmt.Errorf(`No email found for user`)
	}

	notificationContent := deployNotification{
		Success: success,
		App:     appName,
		URL:     a.appURL,
	}

	notificationContent.Services = make([]deployedService, 0)
	for _, service := range services {
		notificationContent.Services = append(notificationContent.Services, *service)
	}

	_, err := request.DoJSON(ctx, fmt.Sprintf(`%s/render/dashboard?from=%s&sender=%s&to=%s&subject=%s`, a.mailerURL, url.QueryEscape(`dashboard@vibioh.fr`), url.QueryEscape(`Dashboard`), url.QueryEscape(user.Email), url.QueryEscape(fmt.Sprintf(`[dashboard] Deploy of %s`, appName))), notificationContent, http.Header{`Authorization`: []string{request.GetBasicAuth(a.mailerUser, a.mailerPass)}}, http.MethodPost)
	if err != nil {
		return fmt.Errorf(`Error while sending email: %v`, err)
	}

	return nil
}
