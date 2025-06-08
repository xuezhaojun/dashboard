package client

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/client-go/rest"
)

func TestCreateOCMClient(t *testing.T) {
	tests := []struct {
		name        string
		config      *rest.Config
		expectError bool
	}{
		{
			name: "valid config",
			config: &rest.Config{
				Host: "https://test-cluster",
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := CreateOCMClient(tt.config)

			if tt.expectError {
				assert.Error(t, err)
				assert.Nil(t, client)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, client)
				assert.NotNil(t, client.Interface)
				assert.NotNil(t, client.ClusterClient)
				assert.NotNil(t, client.AddonClient)
				assert.NotNil(t, client.WorkClient)
				assert.NotNil(t, client.ClusterInformerFactory)
				assert.NotNil(t, client.AddonInformerFactory)
				assert.NotNil(t, client.WorkInformerFactory)
			}
		})
	}
}

func TestCreateOCMClientNilConfig(t *testing.T) {
	assert.Panics(t, func() {
		CreateOCMClient(nil)
	}, "Should panic with nil config")
}
